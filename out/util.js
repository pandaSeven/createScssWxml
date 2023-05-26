'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const vscode = require('vscode')
const index_1 = require('./index')
const vars_1 = require('./vars')
const fs_1 = require('fs')
const path_1 = require('path')
/**
 * 当文件保存时执行扩展
 */
function excuteWhenSave() {
  return vscode.workspace.onWillSaveTextDocument((event) => {
    const editor = vscode.window.activeTextEditor
    if (!editor) return
    const activeDocument = editor.document
    // 只处理处于未保存状态的文件
    if (!activeDocument.isDirty) return console.log('not dirty')
    const fileStr = generateProcess(activeDocument)
    updateScssFile(activeDocument.uri.fsPath, fileStr, () => {
      event.waitUntil(
        new Promise((resolve) => {
          editor.edit((editorBuilder) => {
            editorBuilder.replace(new vscode.Range(new vscode.Position(0, 0), new vscode.Position(activeDocument.lineCount + 1, 0)), fileStr)
            resolve()
          })
        })
      )
    })
  })
}
exports.excuteWhenSave = excuteWhenSave
/**
 * 读取 .scss文件
 * @param currentDocumentFilePath 当前 wxml文件的绝对路径，用于根据此来寻找 .scss文件
 */
function readScssFile(currentDocumentFilePath) {
  let str = ''
  try {
    str = fs_1.readFileSync(path_1.resolve(currentDocumentFilePath, vars_1.default.config.createScssWxmlConf.scssFilePath)).toString()
  } catch (e) {
    console.log('readScssFile Error:', e.toString())
  }
  return str
}
exports.readScssFile = readScssFile
/**
 * 更新 scss，如果是单独的 .scss文件，则更新此文件，否则更新 style标签的内容
 * @param currentDocumentFilePath 当前 wxml 文件的绝对路径，用于根据此来寻找 .scss文件
 * @param scssStr 更新后的 scss 字符串
 * @param noscssFilePathFn 当不指定 .scss文件路径（即使用了 style 标签）时，执行的方法
 */
function updateScssFile(currentDocumentFilePath, scssStr, noscssFilePathFn) {
  console.log('更新scss', currentDocumentFilePath, scssStr, noscssFilePathFn)
  if (!scssStr) return console.log('empty scssStr')
  if (!vars_1.default.config.createScssWxmlConf.scssFilePath) return noscssFilePathFn()
  fs_1.writeFile(path_1.resolve(currentDocumentFilePath, vars_1.default.config.createScssWxmlConf.scssFilePath), scssStr, (err) => {
    if (err) {
      return vscode.window.showInformationMessage('写入scss错误：' + err.toString())
    }
    console.log('写入 scss文件成功', path_1.resolve(currentDocumentFilePath, vars_1.default.config.createScssWxmlConf.scssFilePath))
  })
}
exports.updateScssFile = updateScssFile
/**
 * 编译 scss
 * @param activeDocument 当前 wxml 文件的绝对路径，用于根据此来寻找 .scss文件
 */
function generateProcess(activeDocument) {
  // 如果不是 wxml文件，则忽略
  if (activeDocument.languageId !== 'wxml') {
    console.log('not wxml', activeDocument.languageId)
    return ''
  }
  const activeText = activeDocument.getText()
  // 页面上不存在内容，或者不存在模板内容，则不处理
  if (!activeText || !/<view[\s\S]*<\/view>/.test(activeText)) {
    console.log('no activeText or no view', activeText.length)
    return ''
  }
  let fileStr = ''
  try {
    fileStr = index_1.default(activeText, vars_1.default.config.createScssWxmlConf.scssFilePath ? readScssFile(activeDocument.uri.fsPath) : void 0)
  } catch (e) {
    console.log('getScssFile Error:', e)
  }
  return fileStr
}
exports.generateProcess = generateProcess
/**
 * 读取 createScssWxml扩展的配置项
 */
function updateConfig() {
  const config = vscode.workspace.getConfiguration()
  console.log('config update:', vars_1.default.config.createScssWxmlConf)
  vars_1.default.config.createScssWxmlConf = config.createScssWxml
  if (typeof config.editor.tabSize === 'number') {
    vars_1.default.config.indenConf.tabSize = config.editor.tabSize
  }
}
exports.updateConfig = updateConfig
//# sourceMappingURL=util.js.map
