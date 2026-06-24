.DEFAULT_GOAL := help

export
NOW = $(shell date '+%Y%m%d-%H%M%S')

.PHONY: install
install: ## install packages
	pnpm install

.PHONY: upgrade-astro
upgrade-astro: ## upgrade-astro
	pnpm dlx @astrojs/upgrade

.PHONY: upgrade-packages
upgrade-packages: ## upgrade-packages
	pnpm up

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
