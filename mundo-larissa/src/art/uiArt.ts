import { ellPath, fs, heartPath, lighten, rgrad, sparkle, starPath } from './draw';
import { P } from './palette';
import { registerFamily } from './registry';

/** Pequenos sprites de interface dentro do mundo (balões, estrelinhas, itens escondidos). */
registerFamily('ui', ([name]) => {
  switch (name) {
    case 'excl':
    case 'quest':
    case 'chat':
      return {
        w: 30, h: 34, ox: 15, oy: 34,
        draw: (ctx) => {
          ctx.beginPath();
          ctx.moveTo(15, 33);
          ctx.lineTo(10, 24);
          ctx.lineTo(20, 24);
          ctx.closePath();
          fs(ctx, '#fff', P.ink, 1.2);
          ellPath(ctx, 15, 14, 13, 12);
          fs(ctx, name === 'excl' ? '#ffe08a' : name === 'quest' ? '#9fe3c9' : '#ffffff', P.ink, 1.4);
          ctx.fillStyle = P.ink;
          ctx.font = 'bold 17px "Trebuchet MS", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(name === 'excl' ? '!' : name === 'quest' ? '?' : '…', 15, 15);
        },
      };
    case 'star':
      return {
        w: 30, h: 30, ox: 15, oy: 15,
        draw: (ctx) => {
          starPath(ctx, 15, 15, 13, 6);
          fs(ctx, rgrad(ctx, 15, 15, 13, '#fff7c4', '#f2c14e'), '#c9a54f', 1.3);
          sparkle(ctx, 24, 6, 3);
        },
      };
    case 'arrow':
      return {
        w: 24, h: 26, ox: 12, oy: 26,
        draw: (ctx) => {
          ctx.beginPath();
          ctx.moveTo(12, 25);
          ctx.lineTo(2, 12);
          ctx.lineTo(8, 12);
          ctx.lineTo(8, 2);
          ctx.lineTo(16, 2);
          ctx.lineTo(16, 12);
          ctx.lineTo(22, 12);
          ctx.closePath();
          fs(ctx, '#ffffff', P.pinkDeep, 2);
        },
      };
    case 'heart':
      return {
        w: 20, h: 20, ox: 10, oy: 10,
        draw: (ctx) => {
          heartPath(ctx, 10, 10, 7);
          fs(ctx, P.pink, P.pinkDeep, 1.2);
        },
      };
    case 'hidden': // brilho de item escondido
      return {
        w: 34, h: 34, ox: 17, oy: 28,
        draw: (ctx) => {
          ellPath(ctx, 17, 22, 12, 6);
          const g = ctx.createRadialGradient(17, 22, 1, 17, 22, 12);
          g.addColorStop(0, 'rgba(255,247,176,0.9)');
          g.addColorStop(1, 'rgba(255,247,176,0)');
          ctx.fillStyle = g;
          ctx.fill();
          sparkle(ctx, 17, 14, 9, '#ffffff');
          sparkle(ctx, 17, 14, 5, '#fff3a0');
          sparkle(ctx, 27, 6, 3, '#ffffff');
          sparkle(ctx, 7, 9, 2.5, lighten(P.pink, 0.4));
        },
      };
  }
  return null;
});
