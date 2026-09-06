<?php

declare(strict_types=1);

namespace App\Notifications\Messages;

class WhatsAppMessage
{
    /**
     * @param  list<array<string, mixed>|string>  $parameters
     */
    public function __construct(
        public string $template,
        public array $parameters = [],
        public ?string $documentUrl = null,
        public ?string $buttonUrl = null,
        public ?string $bodyText = null
    ) {
    }

    public static function create(string $template): self
    {
        return new self($template);
    }

    public function template(string $template): self
    {
        $this->template = $template;

        return $this;
    }

    /**
     * @param  list<array<string, mixed>|string>  $parameters
     */
    public function parameters(array $parameters): self
    {
        $this->parameters = $parameters;

        return $this;
    }

    public function documentUrl(?string $url): self
    {
        $this->documentUrl = $url;

        return $this;
    }

    public function buttonUrl(?string $url): self
    {
        $this->buttonUrl = $url;

        return $this;
    }

    public function bodyText(?string $text): self
    {
        $this->bodyText = $text;

        return $this;
    }
}
