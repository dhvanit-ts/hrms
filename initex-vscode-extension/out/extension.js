"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
const vscode = __importStar(require("vscode"));
function activate(context) {
    const watcher = vscode.workspace.createFileSystemWatcher("**/*.{js,ts,go,py}");
    const createHandler = async (uri) => {
        const fileName = uri.path.split("/").pop();
        const ext = fileName.split(".").pop();
        // only if file is empty/new
        const doc = await vscode.workspace.openTextDocument(uri);
        if (doc.getText().length > 0)
            return;
        let boilerplate = "";
        switch (ext) {
            case "ts":
                if (fileName.endsWith(".controller.ts")) {
                    boilerplate = `
export class ${fileName.toUpperCase()}Controller {
  constructor() {}
  async handle(req, res) {
    // your code
  }
}
`;
                }
                break;
            case "go":
                boilerplate = `package main\n\nfunc ${fileName.replace(".go", "")}() {}\n`;
                break;
            // Add more languages
        }
        const edit = new vscode.WorkspaceEdit();
        edit.insert(uri, new vscode.Position(0, 0), boilerplate);
        await vscode.workspace.applyEdit(edit);
    };
    watcher.onDidCreate(createHandler);
    context.subscriptions.push(watcher);
}
//# sourceMappingURL=extension.js.map