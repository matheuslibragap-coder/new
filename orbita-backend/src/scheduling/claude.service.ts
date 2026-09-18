import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { TimeRange } from './free-slot-finder';

export interface SubjectGoal {
  name: string;
  weeklyGoalMinutes: number;
}

export interface SuggestedBlock {
  subject: string;
  startAt: string;
  endAt: string;
  rationale?: string;
}

const PROPOSE_STUDY_BLOCKS_TOOL: Anthropic.Tool = {
  name: 'propose_study_blocks',
  description:
    'Registra a distribuição de blocos de estudo dentro dos horários livres informados, respeitando as metas semanais de cada matéria.',
  input_schema: {
    type: 'object',
    properties: {
      blocks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            subject: { type: 'string', description: 'Nome da matéria/assunto, igual ao informado.' },
            startAt: { type: 'string', description: 'Início do bloco em ISO 8601, dentro de algum horário livre.' },
            endAt: { type: 'string', description: 'Término do bloco em ISO 8601, dentro do mesmo horário livre.' },
            rationale: { type: 'string', description: 'Justificativa curta da escolha deste horário.' },
          },
          required: ['subject', 'startAt', 'endAt'],
        },
      },
    },
    required: ['blocks'],
  },
};

@Injectable()
export class ClaudeService {
  private readonly logger = new Logger(ClaudeService.name);
  private readonly client: Anthropic | null;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    this.model = this.config.get<string>('ANTHROPIC_MODEL', 'claude-sonnet-5');
    this.client = apiKey ? new Anthropic({ apiKey }) : null;
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }

  async suggestStudyBlocks(params: {
    freeSlots: TimeRange[];
    subjects: SubjectGoal[];
    preferredBlockMinutes: number;
  }): Promise<SuggestedBlock[]> {
    if (!this.client) {
      throw new Error('ANTHROPIC_API_KEY não configurada.');
    }

    const system = [
      'Você é o motor de organização de agenda da Orbyta, um SaaS de produtividade para quem estuda e trabalha.',
      'Sua única tarefa é distribuir blocos de estudo dentro dos horários livres reais do usuário.',
      'Regras obrigatórias:',
      '- Cada bloco proposto deve estar totalmente contido em um dos horários livres informados (não pode invadir horário ocupado).',
      '- Blocos não podem se sobrepor entre si.',
      `- Prefira blocos de aproximadamente ${params.preferredBlockMinutes} minutos, mas nunca menores que 20 minutos.`,
      '- Distribua o tempo entre as matérias priorizando quem está mais distante da própria meta semanal.',
      '- Não invente matérias fora da lista informada.',
      'Responda exclusivamente via chamada da ferramenta propose_study_blocks.',
    ].join('\n');

    const userPayload = {
      freeSlots: params.freeSlots.map((slot) => ({ start: slot.start.toISOString(), end: slot.end.toISOString() })),
      subjects: params.subjects,
    };

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      system,
      messages: [{ role: 'user', content: JSON.stringify(userPayload) }],
      tools: [PROPOSE_STUDY_BLOCKS_TOOL],
      tool_choice: { type: 'tool', name: 'propose_study_blocks' },
    });

    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use' && block.name === 'propose_study_blocks',
    );

    if (!toolUse) {
      this.logger.warn('Claude não retornou uma chamada de ferramenta válida.');
      return [];
    }

    const input = toolUse.input as { blocks?: SuggestedBlock[] };
    return input.blocks ?? [];
  }
}
