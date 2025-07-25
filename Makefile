.DEFAULT_GOAL := help

export
NOW = $(shell date '+%Y%m%d-%H%M%S')

.PHONY: install
install: ## install packages
	yarn install

.PHONY: upgrade
upgrade: ## upgrade
	yarn dlx @astrojs/upgrade

.PHONY: upgrade-tailwind
upgrade-tailwind: ## upgrade-tailwind
	yarn dlx @tailwindcss/upgrade
	yarn up daisyui

.PHONY: upgrade-sass
upgrade-sass: ## upgrade-sass
	yarn up sass

.PHONY: dev
dev: ## dev
	yarn dev

.PHONY: help
help: ## Show this help
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z0-9_-]+:.*?## / \
		{printf "\033[38;2;98;209;150m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
