import { defineMdastPlugin } from "satteri"
import GithubSlugger from "github-slugger"

const maxDepth = 3
const tocHeadings = new Set(["contents", "table of contents", "toc"])

const makeItem = h => ({
  type: "listItem",
  spread: false,
  children: [
    {
      type: "paragraph",
      children: [{ type: "link", url: `#${h.slug}`, children: [{ type: "text", value: h.text }] }]
    }
  ]
})

const buildList = headings => {
  const root = { type: "list", ordered: false, spread: false, children: [] }
  const stack = [{ depth: -Infinity, list: root }]
  for (const h of headings) {
    while (stack.length > 1 && h.depth <= stack[stack.length - 1].depth) stack.pop()
    const parent = stack[stack.length - 1].list
    const item = makeItem(h)
    parent.children.push(item)
    const sublist = { type: "list", ordered: false, spread: false, children: [] }
    item.children.push(sublist)
    stack.push({ depth: h.depth, list: sublist })
  }
  pruneEmpty(root)
  return root
}

const pruneEmpty = list => {
  for (const item of list.children) {
    const sublist = item.children[item.children.length - 1]
    if (sublist?.type === "list") {
      if (sublist.children.length === 0) item.children.pop()
      else pruneEmpty(sublist)
    }
  }
}

export const satteriToc = () =>
  defineMdastPlugin({
    name: "toc",
    heading(node, ctx) {
      const text = ctx.textContent(node).trim()
      if (!tocHeadings.has(text.toLowerCase())) return

      const parent = ctx.parent(node)
      if (!parent || !("children" in parent)) return
      const start = ctx.indexOf(node)
      if (start === undefined) return

      const slugger = new GithubSlugger()
      const items = []
      for (let i = 0; i < parent.children.length; i++) {
        const child = parent.children[i]
        if (child.type !== "heading") continue
        if (i <= start) {
          slugger.slug(ctx.textContent(child).trim())
          continue
        }
        if (child.depth > maxDepth) continue
        const t = ctx.textContent(child).trim()
        items.push({ depth: child.depth, text: t, slug: slugger.slug(t) })
      }
      if (items.length === 0) return
      ctx.insertAfter(node, buildList(items))
    }
  })
