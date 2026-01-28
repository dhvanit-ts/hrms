import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
	const watcher = vscode.workspace.createFileSystemWatcher("**/*.{js,ts,go,py}");

	const createHandler = async (uri: vscode.Uri) => {
		const fileName = uri.path.split("/").pop()!;
		const ext = fileName.split(".").pop()!;

		// only if file is empty/new
		const doc = await vscode.workspace.openTextDocument(uri);
		if (doc.getText().length > 0) return;

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
