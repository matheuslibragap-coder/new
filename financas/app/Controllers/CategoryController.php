<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Session;
use App\Models\Category;

final class CategoryController extends Controller
{
    public function index(): void
    {
        $this->view('categories/index', [
            'title'      => 'Contas e cartões',
            'categories' => (new Category())->allWithUsage(),
        ]);
    }

    public function create(): void
    {
        $this->view('categories/form', [
            'title'    => 'Nova conta ou cartão',
            'category' => null,
            'old'      => Session::pullOldInput(),
        ]);
    }

    public function edit(): void
    {
        $category = (new Category())->find((int) Request::query('id', 0));
        if ($category === null) {
            $this->notFound();
        }
        $this->view('categories/form', [
            'title'    => 'Editar conta ou cartão',
            'category' => $category,
            'old'      => Session::pullOldInput(),
        ]);
    }

    public function save(): void
    {
        $model = new Category();
        $id = (int) Request::input('id', 0);
        if ($id > 0 && $model->find($id) === null) {
            $this->notFound();
        }

        $input = [
            'name'        => (string) Request::input('name', ''),
            'color'       => strtoupper((string) Request::input('color', '')),
            'type'        => (string) Request::input('type', ''),
            'closing_day' => (string) Request::input('closing_day', ''),
            'due_day'     => (string) Request::input('due_day', ''),
        ];

        $errors = [];
        if ($input['name'] === '' || mb_strlen($input['name']) > 60) {
            $errors[] = 'Informe o nome (até 60 caracteres).';
        } elseif ($model->nameExists($input['name'], $id ?: null)) {
            $errors[] = 'Já existe uma conta ou cartão com esse nome.';
        }
        if (!preg_match('/^#[0-9A-F]{6}$/', $input['color'])) {
            $errors[] = 'Escolha uma cor válida.';
        }
        if (!isset(Category::TYPE_LABELS[$input['type']])) {
            $errors[] = 'Escolha o tipo.';
        }

        $data = [
            'name'        => $input['name'],
            'color'       => $input['color'],
            'type'        => $input['type'],
            'closing_day' => null,
            'due_day'     => null,
        ];
        if ($input['type'] === Category::TYPE_CARD) {
            // Opcionais: servem só para sugerir o mês da fatura nas compras no crédito.
            $closing = $input['closing_day'] === '' ? null : filter_var($input['closing_day'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 31]]);
            $due = $input['due_day'] === '' ? null : filter_var($input['due_day'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 31]]);
            if ($closing === false || $due === false || ($closing === null) !== ($due === null)) {
                $errors[] = 'Preencha os dois dias (fechamento e vencimento, de 1 a 31) ou deixe os dois em branco.';
            }
            $data['closing_day'] = $closing ?: null;
            $data['due_day'] = $due ?: null;
        }

        $back = $id > 0 ? '/categorias/editar?id=' . $id : '/categorias/nova';
        if ($errors) {
            $this->backWithErrors($back, $errors, $input);
        }

        if ($id > 0) {
            $model->update($id, $data);
            Session::flash('success', 'Conta/cartão atualizado.');
        } else {
            $model->create($data);
            Session::flash('success', 'Conta/cartão cadastrado.');
        }
        redirect('/categorias');
    }

    public function toggle(): void
    {
        $model = new Category();
        $category = $model->find((int) Request::input('id', 0));
        if ($category === null) {
            $this->notFound();
        }
        $activate = !$category['active'];
        $model->setActive((int) $category['id'], $activate);
        Session::flash('success', $activate ? 'Reativado.' : 'Desativado. Os lançamentos antigos continuam no histórico.');
        redirect('/categorias');
    }

    public function delete(): void
    {
        $model = new Category();
        $category = $model->find((int) Request::input('id', 0));
        if ($category === null) {
            $this->notFound();
        }
        if ($model->isInUse((int) $category['id'])) {
            Session::flash('error', 'Já existem lançamentos ou contas ligados a ele. Desative em vez de excluir.');
            redirect('/categorias');
        }
        $model->delete((int) $category['id']);
        Session::flash('success', 'Excluído.');
        redirect('/categorias');
    }
}
