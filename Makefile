.DEFAULT_GOAL := help

export
NOW = $(shell date '+%Y%m%d-%H%M%S')

.PHONY: install
install: ## install packages
	pnpm install

.PHONY: upgrade-astro
upgrade-astro: ## upgrade-astro
	pnpm dlx @astrojs/upgrade

.PHONY: upgrade-tailwind
upgrade-tailwind: ## upgrade-tailwind
	pnpm dlx @tailwindcss/upgrade
	pnpm up daisyui

.PHONY: upgrade-sass
upgrade-sass: ## upgrade-sass
	pnpm up sass

.PHONY: dev
dev: ## dev
	pnpm dev

.PHONY: format
format: ## format
	pnpm exec prettier . --write

.PHONY: help
help: ## Show this help
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z0-9_-]+:.*?## / \
		{printf "\033[38;2;98;209;150m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
