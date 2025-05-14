# MCP Image AI Analyzer

画像を解析し、手順書用の説明文を生成するMCPサーバーです。OpenAI（GPT-4 Vision）とGoogle Gemini Proの両方のAIを使用して画像解析を行うことができます。

## セットアップ

1. 必要な依存関係をインストールします：
```bash
npm install
```

2. 環境変数を設定します：
- `.env.example`ファイルを`.env`にコピーします
- 必要なAPI keyを設定します：
  - `OPENAI_API_KEY`: OpenAIのAPIキー
  - `GEMINI_API_KEY`: Google GeminiのAPIキー
  - `PORT`: サーバーのポート番号（デフォルト: 3000）
  - `OPENAI_MODEL`: OpenAIのモデル名（デフォルト: gpt-4-vision-preview）
  - `GEMINI_MODEL`: Geminiのモデル名（デフォルト: gemini-pro-vision）

3. サーバーを起動します：
```bash
npm run dev
```

## MCPサーバーの設定手順

1. MCPサーバーのインストール：
```bash
npm install -g @agentdesk/mcp
```

2. MCPサーバーの初期化：
```bash
mcp init
```

3. プロジェクトディレクトリで以下のコマンドを実行してMCPの設定を行います：
```bash
mcp config set name "image-ai-analyzer"
mcp config set description "画像解析AIを使用して手順書用の説明文を生成するMCPサーバー"
```

4. サービスの登録：
```bash
mcp service add image-analyzer ./src/index.ts
```

5. MCPサーバーの起動：
```bash
mcp start
```

6. ログの確認：
```bash
mcp logs
```

## API エンドポイント

### OpenAI Vision を使用した画像解析
```bash
POST /analyze/openai
Content-Type: multipart/form-data
Body: image=@画像ファイル
```

### Google Gemini を使用した画像解析
```bash
POST /analyze/gemini
Content-Type: multipart/form-data
Body: image=@画像ファイル
```

## レスポンス形式

```json
{
  "description": "画像の説明文",
  "model": "使用されたモデル名"
}
```

## エラーレスポンス

```json
{
  "error": "エラーメッセージ"
}
```

## 使用可能なモデル

### OpenAI
- gpt-4-vision-preview (デフォルト)
- その他のVision対応モデル

### Google Gemini
- gemini-pro-vision (デフォルト)
- gemini-2.0-flash
- その他のVision対応モデル
