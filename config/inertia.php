<?php

declare(strict_types=1);

return [
    // Match the case-sensitive React page directory used by the Vite resolver.
    'pages' => [
        'ensure_pages_exist' => false,
        'paths' => [
            resource_path('js/Pages'),
        ],
        'extensions' => ['js', 'jsx', 'ts', 'tsx', 'vue'],
    ],
    'testing' => [
        'ensure_pages_exist' => true,
    ],
];
