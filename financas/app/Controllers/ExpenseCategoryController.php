<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Session;
use App\Models\ExpenseCategory;

/** Cadastro das categorias de gasto do Controle diário. */
final class ExpenseCategoryController extends Controller
{
    public function index(): void
    {
        $this->view('daily/categories', [
            'title'      => 'Categorias de gasto',
            'categories' => (new ExpenseCategory())->allWithUsage(),
        ]);
    }

    public function create(): void
    {
        $this->view('daily/category_form', ['title' => 'Nova categoria de gasto', 'category' => null, 'old' => Session::pullOldInput()]);
    }

    public function edit(): void
    {
        $category = $this->findOrFail((int) Request::query('id', 0));
        $this->view('daily/category_form', ['title' => 'Editar categoria de gasto', 'category' => $category, 'old' => Session::pullOldInput()]);
    }

    public function save(): void
    {
        $model = new ExpenseCategory();
        $id = (int) Request::input('id', 0);
        if ($id > 0) {
            $this->findOrFail($id);
        }
        $name = preg_replace('/\s+/u', ' ', (string) Request::input('name', '')) ?? '';
        $color = strtoupper((string) Request::input('color', ''));

        $errors = [];
        if ($name === '' || mb_strlen($name) > 60) {
            $errors[] = 'Informe o nome (até 60 caracteres).';
        } elseif ($model->nameExists($name, $id ?: null)) {
            $errors[] = 'Já existe uma categoria de gasto com esse nome.';
        }
        if (!preg_match('/^#[0-9A-F]{6}$/', $color)) {
            $errors[] = 'Escolha uma cor válida.';
        }
        if ($errors) {
            $this->backWithErrors($id > 0 ? '/diario/categorias/editar?id=' . $id : '/diario/categorias/nova', $errors, ['name' => $name, 'color' => $color]);
        }

        if ($id > 0) {
            $model->update($id, $name, $color);
            Session::flash('success', 'Categoria de gasto atualizada.');
        } else {
            $model->create($name, $color);
            Session::flash('success', 'Categoria de gasto criada.');
        }
        redirect('/diario/categorias');
    }

    public function toggle(): void
    {
        $category = $this->findOrFail((int) Request::input('id', 0));
        (new ExpenseCategory())->setActive((int) $category['id'], !$category['active']);
        Session::flash('success', $category['active'] ? 'Categoria desativada. Os gastos antigos continuam com ela.' : 'Categoria reativada.');
        redirect('/diario/categorias');
    }

    public function delete(): void
    {
        $model = new ExpenseCategory();
        $category = $this->findOrFail((int) Request::input('id', 0));
        if ($model->isInUse((int) $category['id'])) {
            Session::flash('error', 'Essa categoria já tem gastos lançados. Desative-a em vez de excluir.');
            redirect('/diario/categorias');
        }
        $model->delete((int) $category['id']);
        Session::flash('success', 'Categoria de gasto excluída.');
        redirect('/diario/categorias');
    }

    private function findOrFail(int $id): array
    {
        $category = (new ExpenseCategory())->find($id);
        if ($category === null) {
            $this->notFound();
        }
        return $category;
    }
}
