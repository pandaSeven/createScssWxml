'use strict'
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value)
          })
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value))
        } catch (e) {
          reject(e)
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value))
        } catch (e) {
          reject(e)
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected)
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next())
    })
  }
Object.defineProperty(exports, '__esModule', { value: true })
const vscode = require('vscode')
const util_1 = require('./util')
const vars_1 = require('./vars')
function activate(context) {
  console.log('扩展激活')
  // 更新配置项变量
  util_1.updateConfig()
  let listener = null
  // 监控配置项 change
  vscode.workspace.onDidChangeConfiguration(() => {
    // 更新配置项变量
    util_1.updateConfig()
    if (vars_1.default.config.createScssWxmlConf.excuteMode === 'onCommand') {
      // 从 onSave&onCommand 变成 onCommand
      if (!listener) return
      listener.dispose()
    } else {
      // 从 onCommand 变成 onSave&onCommand
      listener = util_1.excuteWhenSave()
    }
  })
  if (vars_1.default.config.createScssWxmlConf.excuteMode === 'onSave&onCommand') {
    // 当文件保存时执行
    listener = util_1.excuteWhenSave()
  }
  // 当使用 createScssWxml 命令时执行
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand('extension.createScssWxml', (textEditor) =>
      __awaiter(this, void 0, void 0, function* () {
        console.log('createScssWxml 执行命令启动')
        if (!textEditor) return console.log('no textEditor')
        const activeDocument = textEditor.document
        // 当前文件未保存，则尝试保存
        if (activeDocument.isDirty) {
          let saveRst = false
          try {
            saveRst = yield extension.createScssWxml.save()
          } catch (e) {
            console.log('save error:', e)
          }
          if (!saveRst) {
            return vscode.window.showInformationMessage('请先保存当前文件')
          }
        }
        if (activeDocument.languageId !== 'wxml') {
          return vscode.window.showInformationMessage('当前不是wxml文件')
        }
        const fileStr = util_1.generateProcess(activeDocument)
        util_1.updateScssFile(activeDocument.uri.fsPath, fileStr, () => {
          textEditor.edit((editorBuilder) => {
            editorBuilder.replace(new vscode.Range(new vscode.Position(0, 0), new vscode.Position(activeDocument.lineCount + 1, 0)), fileStr)
            setTimeout(() => {
              activeDocument.save().then((rst) => {
                console.log('保存结果：', rst)
              })
            }, 0)
          })
        })
      })
    )
  )
}
exports.activate = activate
// this method is called when your extension is deactivated
function deactivate() {
  console.log('扩展释放')
}
exports.deactivate = deactivate
//# sourceMappingURL=extension.js.map
