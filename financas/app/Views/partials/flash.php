<?php foreach ($flash ?? [] as $type => $message): ?>
    <div class="alert alert-<?= e($type) ?>" role="<?= $type === 'error' ? 'alert' : 'status' ?>"><?= e($message) ?></div>
<?php endforeach; ?>
