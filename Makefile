.DEFAULT_GOAL := help

export
NOW = $(shell date '+%Y%m%d-%H%M%S')

.PHONY: upgrade
upgrade: ## upgrade
	yarn dlx @astrojs/upgrade

.PHONY: dev
dev: ## dev
	yarn dev

.PHONY: help
help: ## Show this help
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z0-9_-]+:.*?## / \
		{printf "\033[38;2;98;209;150m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
