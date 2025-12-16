# Guia de Build Mobile - BIVA Imobiliaria

Este guia explica como compilar e publicar o app nas lojas.

**IMPORTANTE:** A compilacao dos apps Android/iOS deve ser feita no seu computador local (nao no Replit), pois requer Android Studio e/ou Xcode.

## Pre-requisitos

### Geral:
- Node.js 22 ou superior (necessario para Capacitor CLI v8)
- Git instalado

### Para Android (Play Store):
- Android Studio instalado
- JDK 17 ou superior
- Conta Google Play Developer ($25 taxa unica)

### Para iOS (App Store):
- Mac com Xcode instalado
- Conta Apple Developer ($99/ano)

---

## Passo 1: Baixar o Projeto

Faca download do projeto do Replit ou clone via Git:

```bash
git clone <url-do-repositorio>
cd <pasta-do-projeto>
npm install
```

**Nota:** Certifique-se de ter Node.js 22+ instalado localmente.

---

## Passo 2: Build do Frontend

```bash
npm run build:mobile
```

---

## Passo 3: Sincronizar com Capacitor

```bash
npm run cap:sync
```

---

## Passo 4A: Compilar Android (APK/AAB)

### Abrir no Android Studio:
```bash
npm run cap:open:android
```

### No Android Studio:
1. Aguarde o Gradle sincronizar
2. Menu: **Build > Generate Signed Bundle / APK**
3. Escolha **Android App Bundle** (AAB) para Play Store
4. Crie ou use uma keystore existente
5. Selecione **release** como build variant
6. Clique em **Create**

O arquivo AAB estara em: `android/app/release/app-release.aab`

### Publicar na Play Store:
1. Acesse: https://play.google.com/console
2. Crie um novo aplicativo
3. Preencha as informacoes (descricao, screenshots, etc.)
4. Faca upload do arquivo AAB
5. Submeta para revisao

---

## Passo 4B: Compilar iOS (IPA)

### Abrir no Xcode:
```bash
npm run cap:open:ios
```

### No Xcode:
1. Selecione o target "App"
2. Configure o **Signing & Capabilities** com sua conta Apple Developer
3. Selecione **Any iOS Device** como destino
4. Menu: **Product > Archive**
5. Apos o archive, clique em **Distribute App**
6. Escolha **App Store Connect**

### Publicar na App Store:
1. Acesse: https://appstoreconnect.apple.com
2. Crie um novo aplicativo
3. Preencha as informacoes (descricao, screenshots, etc.)
4. O build aparecera automaticamente apos upload
5. Submeta para revisao

---

## Configuracoes Importantes

### Alterar Nome do App
Edite `capacitor.config.ts`:
```typescript
appName: 'BIVA Imobiliaria',
```

### Alterar ID do App
Edite `capacitor.config.ts`:
```typescript
appId: 'com.biva.app',
```

### Icones do App

#### Android:
Substitua os icones em:
- `android/app/src/main/res/mipmap-*/ic_launcher.png`

Tamanhos necessarios:
- mdpi: 48x48
- hdpi: 72x72
- xhdpi: 96x96
- xxhdpi: 144x144
- xxxhdpi: 192x192

#### iOS:
Substitua os icones em:
- `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

Use o site https://appicon.co para gerar todos os tamanhos automaticamente.

### Splash Screen

#### Android:
Edite `android/app/src/main/res/drawable/splash.xml`

#### iOS:
Edite em Xcode: `ios/App/App/Assets.xcassets/Splash.imageset/`

---

## URLs do Backend

Por padrao, o app carrega os arquivos localmente. Para conectar ao backend:

1. Publique seu backend (deploy no Replit)
2. Edite `capacitor.config.ts`:

```typescript
server: {
  url: 'https://seu-app.replit.app',
  cleartext: true
}
```

3. Reconstrua e sincronize:
```bash
npm run build:mobile
npm run cap:sync
```

---

## Checklist para Publicacao

### Play Store:
- [ ] Conta Google Play Developer criada
- [ ] Screenshots do app (min. 2)
- [ ] Icone 512x512
- [ ] Descricao curta (80 caracteres)
- [ ] Descricao completa (4000 caracteres)
- [ ] Categoria do app
- [ ] Politica de privacidade (URL)
- [ ] Classificacao de conteudo preenchida

### App Store:
- [ ] Conta Apple Developer criada
- [ ] Screenshots para cada tamanho de tela
- [ ] Icone 1024x1024
- [ ] Descricao do app
- [ ] Palavras-chave
- [ ] Categoria
- [ ] Politica de privacidade (URL)
- [ ] Classificacao etaria

---

## Suporte

Para duvidas sobre:
- Capacitor: https://capacitorjs.com/docs
- Play Store: https://support.google.com/googleplay/android-developer
- App Store: https://developer.apple.com/support/

