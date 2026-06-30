import { defineHastPlugin } from "satteri"

const calloutRegex = /^\[!(?<type>[^\]]+)\](?<collapse>[+-]?)\s?/

const el = (tagName, properties, children) => ({ type: "element", tagName, properties, children })

export const satteriCallouts = defineHastPlugin({
  name: "callouts",
  element: {
    filter: ["blockquote"],
    visit(node, ctx) {
      const children = (node.children ?? []).filter(c => !(c.type === "text" && c.value.trim() === ""))
      const firstP = children[0]
      if (!firstP || firstP.type !== "element" || firstP.tagName !== "p") return
      const firstText = firstP.children?.[0]
      if (!firstText || firstText.type !== "text") return

      const match = calloutRegex.exec(firstText.value)
      if (!match?.groups) return

      const type = match.groups.type.toLowerCase()
      const collapse = match.groups.collapse
      const collapsible = collapse === "+" || collapse === "-"

      // Strip the `[!type]` marker from the first text node, then split the first
      // paragraph at its first newline: before -> title, after -> content.
      const inline = firstP.children.map((c, i) =>
        i === 0 && c.type === "text" ? { type: "text", value: c.value.replace(calloutRegex, "") } : c
      )
      const titleInlines = []
      const contentInlines = []
      let split = false
      for (const c of inline) {
        if (!split && c.type === "text" && c.value.includes("\n")) {
          const [head, ...rest] = c.value.split("\n")
          if (head) titleInlines.push({ type: "text", value: head })
          const tail = rest.join("\n")
          if (tail) contentInlines.push({ type: "text", value: tail })
          split = true
          continue
        }
        ;(split ? contentInlines : titleInlines).push(c)
      }

      const titleInner = el(
        "div",
        { className: ["callout-title-inner"] },
        titleInlines.length ? titleInlines : [{ type: "text", value: type.charAt(0).toUpperCase() + type.slice(1) }]
      )

      const contentNodes = []
      if (contentInlines.length) contentNodes.push(el("p", {}, contentInlines))
      contentNodes.push(...children.slice(1))

      const title = el(collapsible ? "summary" : "div", { className: ["callout-title"] }, [titleInner])
      const content = el("div", { className: ["callout-content"] }, contentNodes)

      ctx.replaceNode(node, {
        type: "element",
        tagName: collapsible ? "details" : "div",
        properties: {
          className: ["callout"],
          "data-callout": type,
          "data-collapsible": collapsible ? "true" : "false",
          open: collapse === "+" ? "open" : undefined
        },
        children: [title, content]
      })
    }
  }
})
