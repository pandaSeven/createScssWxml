'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const parseTemplate_1 = require('./parseTemplate')
const scssManage_1 = require('./scssManage')
// 在 scss文本外再包裹一层，避免遗漏变量等内容
const scssWrapper = 'wrapper {'
exports.default = (wxmlStr, scssStr) => {
  let originscssStr = ''
  let originscssMt = null
  let originTemplateStr = ''
  const originTemplateMt = wxmlStr.match(/<view[^>]*>([\s\S]*)<\/view>/)
  if (originTemplateMt) {
    originTemplateStr = originTemplateMt[1].trim()
  }
  console.log(originTemplateMt, originTemplateStr)
  if (typeof scssStr === 'string') {
    originscssStr = scssStr
  } else {
    originscssMt = wxmlStr.match(/<style[^>]*>([\s\S]*)<\/style>/)
    if (originscssMt) {
      originscssStr = originscssMt[1].trim()
    }
  }
  // 解析 template文本得到 templateAst对象
  const templateObj = parseTemplate_1.default('<wrapper>' + originTemplateStr + '</wrapper>')
  // 解析 scss文本得到 scssAst对象
  const scssObj = scssManage_1.scssStr2Ast(scssWrapper + originscssStr + '}')
  // 根据 templateAst 重置 scssAst（只增不删）
  scssManage_1.resetScss(templateObj, scssObj)
  // 将更新后的 scssAst转换为 scss文本
  const newscssStr = scssManage_1.scssAstObj2Str(scssObj.children[0]).trim().slice(scssWrapper.length, -1).trimLeft()
  // 将 scss文本写入本地文件
  let newwxmlFile = ''
  if (typeof scssStr === 'string') {
    newwxmlFile = newscssStr
  } else {
    if (originscssMt) {
      const scssMt = wxmlStr.match(/([\s\S]*)(<style[^>]*>)([\s\S]*)(<\/style>\s*)/)
      if (scssMt) {
        newwxmlFile = scssMt[1] + scssMt[2] + '\n' + newscssStr.trimRight() + '\n' + scssMt[4]
      }
    } else {
      newwxmlFile = wxmlStr + `\n<style lang="scss" scoped>${'\n' + newscssStr.trimRight() + '\n'}</style>\n`
    }
  }
  return newwxmlFile
}
//# sourceMappingURL=index.js.map
