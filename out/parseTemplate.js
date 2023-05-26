'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
// 匹配属性标签
const attrRE = /((:|v-bind:)?[\w$\-]+)|(?<word>["'"]){1}[\s\S]*?\k<word>/g
const bindAttrValueRE = /(?<=('|"))[\w\-$]+(?=\1)/g
// html非自闭合标签
// wrapper 是额外添加的用于辅助构建 scss AST 的标签
const htmlBlockTagList = [
  'wrapper',
  'a',
  'abbr',
  'acronym',
  'address',
  'applet',
  'article',
  'aside',
  'audio',
  'b',
  'basefont',
  'bdi',
  'bdo',
  'big',
  'blockquote',
  'button',
  'canvas',
  'caption',
  'center',
  'cite',
  'code',
  'colgroup',
  'command',
  'datalist',
  'dd',
  'del',
  'details',
  'dfn',
  'dialog',
  'dir',
  'div',
  'dl',
  'dt',
  'em',
  'fieldset',
  'figcaption',
  'figure',
  'font',
  'footer',
  'form',
  'frame',
  'frameset',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'head',
  'header',
  'i',
  'iframe',
  'ins',
  'kbd',
  'label',
  'legend',
  'li',
  'main',
  'map',
  'mark',
  'menu',
  'meter',
  'nav',
  'noframes',
  'noscript',
  'object',
  'ol',
  'optgroup',
  'option',
  'output',
  'p',
  'pre',
  'progress',
  'q',
  'rp',
  'rt',
  'ruby',
  's',
  'samp',
  'section',
  'select',
  'small',
  'span',
  'strike',
  'strong',
  'sub',
  'summary',
  'sup',
  'table',
  'tbody',
  'td',
  'textarea',
  'tfoot',
  'th',
  'thead',
  'time',
  'title',
  'tr',
  'tt',
  'u',
  'ul',
  'var',
  'video',
  'view'
]
// htmk自闭合标签
const voidElementList = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'menuitem', 'meta', 'param', 'source', 'track', 'wbr', 'image']
/**
 * 解析标签tag
 * @param tag 标签信息，例如 <div class="class1"></div>
 */
function parseTag(tag) {
  let i = 0
  let key
  let attrType = 'attrs' /* attrs */
  const res = {
    type: 'tag',
    name: '',
    voidElement: false,
    ['attrs' /* attrs */]: {},
    ['bindAttrs' /* bindAttrs */]: {},
    children: []
  }
  // 匹配普通选择器
  tag.replace(attrRE, (match) => {
    if (i % 2) {
      key = match
      // 是否是 wxml bind属性
      if (match.indexOf(':') === 0 || match.indexOf('v-bind:') === 0) {
        key = match.replace(/(:|v-bind:)/, '')
        attrType = 'bindAttrs' /* bindAttrs */
      } else {
        attrType = 'attrs' /* attrs */
      }
    } else {
      if (i === 0) {
        if (voidElementList.includes(match) || tag.charAt(tag.length - 2) === '/') {
          res.voidElement = true
        }
        res.name = match
      } else {
        // 去掉属性值两侧的引号字符串
        res[attrType][key] = match.replace(/^\s*["']|["']\s*$/g, '')
      }
    }
    i++
    return ''
  })
  return res
}
/**
 * 解析template
 * @param html html字符串片段
 */
function parse(html) {
  if (!html) {
    return []
  }
  const tagRE = /<!--[\s\S]*?-->|<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>/g
  let result = []
  let current = null
  let level = -1
  let arr = []
  let byTag = {}
  html.replace(tagRE, (tag) => {
    // 注释标签，跳过不处理
    if (tag.indexOf('<!--') !== -1) return ''
    const isOpen = tag.charAt(1) !== '/'
    let parent
    if (isOpen) {
      level++
      current = parseTag(tag)
      byTag[current.tagName] = current
      if (level === 0) {
        result.push(current)
      }
      parent = arr[level - 1]
      if (parent) {
        parent.children.push(current)
      }
      arr[level] = current
    }
    if (!isOpen || current.voidElement) {
      level--
    }
    return ''
  })
  console.log('result:', result)
  return result
}
/**
 * 分离同一个标签的多个选择器
 * @param seletorStr 选择器集合字符串，例如 "['class1', 'class2]"
 * @param symbol 选择器标识，例如 class的 .  id的 #
 * @param bindAttr 是否是 wxml的绑定元素（v-bind）
 */
function splitSeletor(seletorStr, symbol, isBind) {
  const arr = []
  let mt = isBind ? seletorStr.match(bindAttrValueRE) : seletorStr.split(/\s+/).filter((item) => item)
  if (mt) {
    mt.forEach((item) => {
      arr.push(symbol + item)
    })
  }
  return arr
}
const selectorTypeInfo = [
  { name: 'class', tag: '.' },
  { name: 'id', tag: '#' }
]
/**
 * 获取当前 templateAst上的选择器
 * @param astObj 模板 templateAst
 */
function getSelectorNames(astObj) {
  const currentObj = {
    selectorNames: [],
    children: []
  }
  selectorTypeInfo.forEach((item) => {
    ;['attrs' /* attrs */, 'bindAttrs' /* bindAttrs */].forEach((attrName) => {
      if (astObj[attrName][item.name]) {
        currentObj.selectorNames = currentObj.selectorNames.concat(splitSeletor(astObj[attrName][item.name], item.tag, attrName === 'bindAttrs' /* bindAttrs */))
      }
    })
  })
  if (currentObj.selectorNames.length === 0) {
    if (astObj.voidElement) {
      if (!voidElementList.includes(astObj.name)) {
        // 是组件标签，并且自闭合（无子元素）
        return null
      }
    }
    // 将标签名作为选择器
    currentObj.selectorNames.push(astObj.name)
  }
  return currentObj
}
/**
 * 将解析后的 ast 转换为所需的结构
 * @param astObj 模板 templateAst
 */
function transTemplateAst(astObj) {
  if (!astObj || astObj.type !== 'tag') return null
  // 如果标签名开头字母大写，或者不是合法的 html标签，则都默认是组件标签（包括内置组件），
  // 并且，组件不存在 class 或 id 属性，则将组件的 children 当做是内置组件父标签的 children
  if ((astObj.name.match(/^[A-Z]/) || !htmlBlockTagList.concat(voidElementList).includes(astObj.name)) && !astObj.attrs.class && !astObj.attrs.id) {
    if (!astObj.children.length) return null
    return astObj.children
      .map((cAstObj) => transTemplateAst(cAstObj))
      .reduce((t, c) => {
        return c ? t.concat(c) : t
      }, [])
  }
  const currentObj = getSelectorNames(astObj)
  if (astObj.children) {
    for (let i = 0; i < astObj.children.length; i++) {
      let childNode = transTemplateAst(astObj.children[i])
      if (childNode) {
        currentObj.children = currentObj.children.concat(childNode)
      }
    }
  }
  return currentObj
}
exports.default = (templateStr) => {
  return transTemplateAst(parse(templateStr)[0])
}
//# sourceMappingURL=parseTemplate.js.map
