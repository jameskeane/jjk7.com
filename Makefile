PAGES := $(wildcard _pages/*.md)
POSTS := $(wildcard _posts/*.md)
GENERATED := $(patsubst _pages/%.md,.generated/%.html,$(PAGES)) $(patsubst _posts/%.md,.generated/posts/%.html,$(POSTS))

all: $(GENERATED)

.generated/%.html: _pages/%.md | .generated
	node bin/render-page.js $< $@

.generated/posts/%.html: _posts/%.md | .generated
	node bin/render-page.js $< $@

.generated:
	mkdir -p .generated/posts

clean:
	rm -rf .generated

watch:
	npx nodemon -w . -e md --exec "make all" &
	npx http-server -c-1 .generated &
	wait

.PHONY: all
