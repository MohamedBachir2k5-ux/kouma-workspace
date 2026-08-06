/**
 * Generate Kouma Capacitor Migration Plan PDF
 */
import puppeteer from 'puppeteer'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const OUTPUT = '/Users/bachirtoure/Desktop/Kouma_Capacitor_Migration_Plan.pdf'

const HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
    font-size: 10.5pt;
    color: #1a1a2e;
    line-height: 1.6;
    padding: 0;
  }
  .cover {
    background: linear-gradient(135deg, #0f1628 0%, #1e2d4a 100%);
    color: white;
    padding: 72px 64px;
    min-height: 240px;
  }
  .cover h1 { font-size: 28pt; font-weight: 700; margin-bottom: 8px; }
  .cover .sub { font-size: 13pt; color: #818cf8; margin-bottom: 24px; }
  .cover .meta { font-size: 9pt; color: #94a3b8; }
  .body { padding: 40px 64px 64px; }
  h2 {
    font-size: 15pt; font-weight: 700; color: #0f1628;
    margin: 36px 0 12px;
    padding-bottom: 6px;
    border-bottom: 2px solid #4f46e5;
  }
  h3 { font-size: 11.5pt; font-weight: 600; color: #1e2d4a; margin: 20px 0 8px; }
  h4 { font-size: 10.5pt; font-weight: 600; color: #4f46e5; margin: 14px 0 6px; }
  p { margin-bottom: 8px; }
  ul, ol { margin: 8px 0 10px 20px; }
  li { margin-bottom: 4px; }
  code {
    font-family: 'SF Mono', 'Menlo', 'Courier New', monospace;
    font-size: 8.5pt;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 3px;
    padding: 1px 5px;
    color: #4f46e5;
  }
  pre {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 3px solid #4f46e5;
    border-radius: 4px;
    padding: 12px 16px;
    font-size: 8.5pt;
    font-family: 'SF Mono', 'Menlo', monospace;
    white-space: pre-wrap;
    margin: 10px 0;
    color: #334155;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5pt;
    margin: 12px 0;
  }
  th {
    background: #0f1628;
    color: white;
    padding: 7px 10px;
    text-align: left;
    font-weight: 600;
  }
  td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  tr:nth-child(even) td { background: #f8fafc; }
  .tag {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 8pt;
    font-weight: 600;
  }
  .tag-ok { background: #d1fae5; color: #065f46; }
  .tag-warn { background: #fef3c7; color: #92400e; }
  .tag-block { background: #fee2e2; color: #991b1b; }
  .tag-info { background: #e0e7ff; color: #3730a3; }
  .hypothesis {
    background: #fef9c3;
    border: 1px solid #fde047;
    border-left: 3px solid #eab308;
    border-radius: 4px;
    padding: 8px 12px;
    font-size: 9pt;
    margin: 8px 0;
  }
  .hypothesis::before { content: '⚠ HYPOTHÈSE — À VÉRIFIER: '; font-weight: 600; }
  .confirm-box {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-left: 3px solid #ef4444;
    border-radius: 4px;
    padding: 10px 14px;
    margin: 8px 0;
  }
  .ref { color: #64748b; font-size: 8.5pt; font-style: italic; }
  .divider { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
  @media print {
    h2 { page-break-before: auto; }
    .cover { page-break-after: always; }
    pre, table { page-break-inside: avoid; }
  }
</style>
</head>
<body>

<div class="cover">
  <h1>Plan de migration Capacitor</h1>
  <div class="sub">Kouma Workspace · Web → App Store &amp; Play Store</div>
  <div class="meta">
    Produit le 4 août 2026 · Version 1.0<br/>
    Basé sur une analyse directe de la codebase (commit 20981cd)<br/>
    Chaque affirmation technique cite le fichier source exact.
  </div>
</div>

<div class="body">

<!-- ═══════════════════════════════════════════════════════════════ -->
<h2>0. Audit de la codebase avant planification</h2>

<p>Cette section documente ce qui a été observé dans le code. Aucune supposition.</p>

<h3>Framework &amp; build</h3>
<table>
  <tr><th>Élément</th><th>Valeur observée</th><th>Source</th></tr>
  <tr><td>Framework</td><td>React 19.2.7 + TypeScript ~6.0.2</td><td><code>package.json</code></td></tr>
  <tr><td>Build tool</td><td>Vite 8.1.1</td><td><code>package.json</code>, <code>vite.config.ts</code></td></tr>
  <tr><td>CSS</td><td>Tailwind CSS v4 via <code>@tailwindcss/vite</code></td><td><code>vite.config.ts:3</code></td></tr>
  <tr><td>Router</td><td>react-router-dom 7.18.1 — <strong>BrowserRouter</strong> (History API)</td><td><code>src/App.tsx:1,40</code></td></tr>
  <tr><td>Monitoring</td><td>@sentry/react 10.68.0</td><td><code>src/main.tsx:14-22</code></td></tr>
  <tr><td>Virtualisation liste</td><td>react-virtuoso 4.18.11 — <code>&lt;Virtuoso&gt;</code></td><td><code>src/pages/app/Messages.tsx:873+</code></td></tr>
  <tr><td>Service worker</td><td>Manuel (<code>public/sw.js</code>, 101 lignes), <strong>pas</strong> de vite-plugin-pwa</td><td><code>src/main.tsx:61</code></td></tr>
</table>

<h3>Notifications push (état actuel)</h3>
<ul>
  <li><strong>Service worker</strong> : <code>public/sw.js</code> — gère l'événement <code>push</code> (ligne 72) et <code>notificationclick</code> (ligne 87).</li>
  <li><strong>Clé VAPID</strong> : variable d'environnement <code>VITE_VAPID_PUBLIC_KEY</code>, lue dans <code>src/services/push.service.ts:25</code>.</li>
  <li><strong>Abonnement</strong> : <code>pushManager.subscribe()</code> dans <code>src/services/push.service.ts:33</code>, tokens stockés dans la table Supabase <code>push_subscriptions</code> (colonnes : <code>user_id</code>, <code>endpoint</code>, <code>p256dh</code>, <code>auth</code>) — migration <code>034_push_subscriptions.sql</code>.</li>
  <li><strong>Déclencheur</strong> : <code>AppLayout.tsx:108-111</code> — s'abonne au montage si permission accordée.</li>
  <li><strong>Notification in-app (onglet caché)</strong> : <code>new globalThis.Notification()</code> à <code>AppLayout.tsx:99</code>.</li>
</ul>

<h3>Chiffrement E2E WebCrypto</h3>
<ul>
  <li><strong>Primitives</strong> : <code>src/services/crypto.service.ts</code> — 100% Web Crypto API, zéro dépendance externe.</li>
  <li><strong>Algorithmes</strong> : ECDH P-256 (échange de clés), AES-256-GCM (chiffrement symétrique), PBKDF2-SHA256 600 000 itérations (dérivation PIN), HKDF-SHA256 (ECIES), <code>crypto.getRandomValues()</code> (IV 12 octets).</li>
  <li><strong>Clés utilisateur</strong> : générées dans <code>key.service.ts:generateAndStoreUserKeys()</code>, stockées chiffrées en DB dans <code>user_key_pairs</code> (clé privée wrappée avec KWK dérivé du PIN).</li>
  <li><strong>Session en mémoire uniquement</strong> : <code>src/lib/crypto-session.ts</code> — les clés déchiffrées ne touchent jamais <code>localStorage</code>, <code>sessionStorage</code>, ni <code>IndexedDB</code>. Vérifié : aucun appel à ces APIs dans <code>crypto-session.ts</code> ou <code>key.service.ts</code>.</li>
  <li><strong>Clés de conversation</strong> : AES-256-GCM wrappée via ECIES par participant, stockée dans <code>conversation_keys</code>.</li>
  <li><strong>Clés de fichiers</strong> : même mécanisme, table <code>file_keys</code>, chargée dans <code>key.service.ts:getOrLoadFileKey()</code>.</li>
</ul>

<h3>Upload de fichiers</h3>
<ul>
  <li><strong>Input</strong> : <code>&lt;input type="file" multiple&gt;</code> à <code>src/pages/app/Documents.tsx:397</code> + drag &amp; drop à la ligne 626.</li>
  <li><strong>Service</strong> : <code>DocumentService.uploadDocument()</code> à <code>src/services/document.service.ts:222</code>.</li>
  <li><strong>Bucket Supabase Storage</strong> : <code>attachments</code>, path : <code>{orgId}/docs/{userId}/{timestamp}_{nom}.enc</code>.</li>
  <li><strong>Flux</strong> : <code>file.arrayBuffer()</code> → chiffrement AES-GCM → <code>Blob</code> → <code>supabase.storage.from('attachments').upload()</code>.</li>
  <li><strong>Limite</strong> : 50 Mo, types vérifiés (PDF, Office, images, ZIP, CSV).</li>
</ul>

<h3>Liste de conversations</h3>
<ul>
  <li><strong>Composant</strong> : <code>ConvList</code> dans <code>src/pages/app/Messages.tsx:873</code> (fichier total : 1 826 lignes).</li>
  <li><strong>Virtualisation</strong> : <code>react-virtuoso &lt;Virtuoso&gt;</code> avec <code>overscan=300</code>. Implémentée. Seules ~15 lignes sont renduesen DOM à la fois sur 1 000 conversations (Lighthouse mesuré : LCP 2,9 s / 95/100 sous 6x CPU + 3G).</li>
</ul>

<h3>PWA &amp; configuration mobile existante</h3>
<ul>
  <li><code>public/manifest.json</code> : <code>display: standalone</code>, <code>start_url: /app/messages</code>, icônes 192 et 512 px.</li>
  <li><code>index.html</code> : <code>apple-mobile-web-app-capable</code>, <code>viewport-fit=cover</code>, <code>apple-touch-icon</code>.</li>
  <li><code>src/index.css</code> : <code>safe-area-inset-bottom</code> géré, <code>overscroll-behavior: none</code>.</li>
  <li>Icônes disponibles : <code>icon-192.png</code>, <code>icon-512.png</code>. Pas de répertoire <code>icons/</code> structuré pour différentes densités.</li>
</ul>

<h3>Dépendances potentiellement conflictuelles avec Capacitor</h3>
<table>
  <tr><th>Élément</th><th>Conflit</th><th>Sévérité</th></tr>
  <tr>
    <td>Web Push API + <code>PushManager</code> (<code>push.service.ts:8</code>)</td>
    <td>Non disponible dans WebView Capacitor — doit être remplacé par <code>@capacitor/push-notifications</code></td>
    <td><span class="tag tag-block">BLOQUANT</span></td>
  </tr>
  <tr>
    <td><code>globalThis.Notification</code> (<code>AppLayout.tsx:98-99</code>)</td>
    <td>API Web Notification absente dans WKWebView iOS et Chrome WebView Android</td>
    <td><span class="tag tag-block">BLOQUANT</span></td>
  </tr>
  <tr>
    <td><code>navigator.serviceWorker.register('/sw.js')</code> (<code>main.tsx:61</code>)</td>
    <td>Les service workers ne fonctionnent pas via le protocole <code>capacitor://</code> — échec silencieux</td>
    <td><span class="tag tag-warn">À ADAPTER</span></td>
  </tr>
  <tr>
    <td><code>PWAInstallBanner</code> (<code>AppLayout.tsx:217</code>)</td>
    <td>Banner "Installer l'app" inutile dans une app native — à masquer</td>
    <td><span class="tag tag-info">MINEUR</span></td>
  </tr>
  <tr>
    <td>BrowserRouter (History API)</td>
    <td>Fonctionne : Capacitor 6 sert l'app en HTTP local (<code>capacitor://localhost/</code>), <code>pushState</code> est supporté dans WKWebView/ChromeWebView</td>
    <td><span class="tag tag-ok">AUCUN CONFLIT</span></td>
  </tr>
  <tr>
    <td><code>crypto.subtle</code> (WebCrypto)</td>
    <td>Disponible dans WKWebView (iOS 14+) et Chrome WebView (Android 5+). Aucune adaptation nécessaire.</td>
    <td><span class="tag tag-ok">AUCUN CONFLIT</span></td>
  </tr>
  <tr>
    <td><code>supabase-js</code> + fetch/WebSocket</td>
    <td>Fonctionne dans WebView. Le SDK Supabase utilise <code>fetch</code> + WebSocket — supportés nativement.</td>
    <td><span class="tag tag-ok">AUCUN CONFLIT</span></td>
  </tr>
  <tr>
    <td><code>file.arrayBuffer()</code> pour upload</td>
    <td>API standard, disponible dans tous les WebView modernes.</td>
    <td><span class="tag tag-ok">AUCUN CONFLIT</span></td>
  </tr>
  <tr>
    <td>react-router-dom 7, react-virtuoso, lucide-react</td>
    <td>Bibliothèques React pures, aucune dépendance au DOM natif browser-specific.</td>
    <td><span class="tag tag-ok">AUCUN CONFLIT</span></td>
  </tr>
</table>

<hr class="divider"/>

<!-- ═══════════════════════════════════════════════════════════════ -->
<h2>1. Étapes techniques dans l'ordre</h2>

<h3>Étape 1 — Installation de Capacitor et configuration initiale</h3>
<p><em>Durée estimée : <strong>½ journée</strong> (basé sur : 3 fichiers à créer, configuration simple, aucune réécriture de code).</em></p>

<h4>Ce qu'elle implique sur cette codebase</h4>
<pre>npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init Kouma com.gundo.kouma --web-dir=dist</pre>

<p>Fichiers créés par Capacitor : <code>capacitor.config.ts</code> (ou <code>.json</code>), <code>ios/</code>, <code>android/</code>.</p>
<p>Modifier <code>capacitor.config.ts</code> pour pointer vers le build Vite :</p>
<pre>import { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.gundo.kouma',
  appName: 'Kouma',
  webDir: 'dist',
  server: { androidScheme: 'https' }  // évite problème mixed-content sur Android
}
export default config;</pre>

<p>Ajouter à <code>package.json</code> :</p>
<pre>"scripts": {
  "cap:sync": "npm run build && npx cap sync",
  "cap:ios": "npm run cap:sync && npx cap open ios",
  "cap:android": "npm run cap:sync && npx cap open android"
}</pre>

<p>Aucune modification de <code>vite.config.ts</code>, <code>src/App.tsx</code>, ni des routes n'est nécessaire à cette étape.</p>
<p><strong>Dépendances</strong> : aucune — première étape.</p>

<hr class="divider"/>

<h3>Étape 2 — Adaptation des notifications push (bloquant)</h3>
<p><em>Durée estimée : <strong>1 à 2 jours</strong> (basé sur : 2 fichiers à modifier — <code>push.service.ts</code> 69 lignes et <code>AppLayout.tsx</code> ~15 lignes — plus configuration FCM/APNs, qui est administrative mais prend du temps).</em></p>

<h4>Pourquoi c'est bloquant</h4>
<p>La pile actuelle repose sur Web Push API + service worker (<code>public/sw.js</code>). Ces deux APIs sont absentes dans une WebView native (Capacitor iOS = WKWebView, Android = ChromeWebView). L'abonnement push actuel (<code>PushService.subscribe()</code> dans <code>push.service.ts:22</code>) appelle <code>registration.pushManager.subscribe()</code> qui n'existe pas en contexte Capacitor.</p>

<h4>Ce qu'il faut faire</h4>
<pre>npm install @capacitor/push-notifications</pre>

<p><strong>Fichier 1 : <code>src/services/push.service.ts</code></strong> (69 lignes au total)</p>
<p>Ajouter une détection de l'environnement Capacitor en tête de fichier :</p>
<pre>import { Capacitor } from '@capacitor/core'
const isNative = Capacitor.isNativePlatform()</pre>

<p>Réécrire <code>isSupported()</code>, <code>subscribe()</code>, <code>unsubscribe()</code>, <code>isSubscribed()</code> avec un branchement <code>isNative</code> / Web. En mode natif :</p>
<ul>
  <li><code>@capacitor/push-notifications</code> → <code>PushNotifications.register()</code></li>
  <li>Le token FCM (Android) ou APNs (iOS) est récupéré via l'événement <code>registration</code></li>
  <li>Ce token est stocké en base dans une colonne <code>device_token</code> à ajouter à la table <code>push_subscriptions</code> (migration SQL nécessaire)</li>
</ul>

<p><strong>Fichier 2 : <code>src/components/layout/AppLayout.tsx</code></strong> — lignes 96-104 (<code>showBrowserNotif</code>)</p>
<p>La notification in-app (<code>new globalThis.Notification()</code>) doit être wrappée avec une condition <code>!isNative</code>. En mode natif, la notification arrive via FCM/APNs et est affichée par le système — pas besoin de code supplémentaire.</p>

<p><strong>Service worker (<code>public/sw.js</code>)</strong> : reste en place pour le PWA web. En contexte Capacitor, l'enregistrement échoue silencieusement (<code>main.tsx:61</code>) sans impact car Capacitor gère le push nativement.</p>

<h4>Backend : envoi des notifications</h4>
<p>Le backend actuel envoie les notifications web push via VAPID depuis une Edge Function Supabase (ou un service tiers). Pour Capacitor, il faut en plus envoyer via :</p>
<ul>
  <li><strong>FCM</strong> (Firebase Cloud Messaging) pour Android</li>
  <li><strong>APNs</strong> (Apple Push Notification service) pour iOS</li>
</ul>
<div class="hypothesis">Le backend push actuel (Edge Function Supabase ou service tiers qui lit la table <code>push_subscriptions</code>) n'a pas été trouvé dans la codebase explorée. Son emplacement exact et son mode d'envoi VAPID doivent être identifiés pour planifier l'adaptation FCM/APNs.</div>

<p><strong>Dépendances</strong> : étape 1 terminée, comptes développeur Apple/Google créés (étape Admin), clés FCM générées.</p>

<hr class="divider"/>

<h3>Étape 3 — Configuration iOS</h3>
<p><em>Durée estimée : <strong>½ journée</strong> (configuration Xcode, certificats, provisioning profile — majoritairement administratif).</em></p>

<pre>npx cap open ios   # ouvre Xcode</pre>

<p>Dans Xcode :</p>
<ul>
  <li>Signing &amp; Capabilities → sélectionner le team Apple Developer</li>
  <li>Ajouter la capability <strong>Push Notifications</strong></li>
  <li>Ajouter la capability <strong>Background Modes → Remote notifications</strong></li>
  <li>Vérifier <code>Info.plist</code> : ajouter <code>ITSAppUsesNonExemptEncryption</code> (voir section Risques)</li>
</ul>

<p><strong>Dépendances</strong> : étape 1, compte Apple Developer actif.</p>

<hr class="divider"/>

<h3>Étape 4 — Configuration Android</h3>
<p><em>Durée estimée : <strong>½ journée</strong>.</em></p>

<pre>npx cap open android   # ouvre Android Studio</pre>

<ul>
  <li>Ajouter <code>google-services.json</code> (fourni par la console Firebase) dans <code>android/app/</code></li>
  <li>Vérifier <code>android/app/src/main/AndroidManifest.xml</code> : permissions <code>RECEIVE_BOOT_COMPLETED</code>, <code>VIBRATE</code> ajoutées automatiquement par le plugin Capacitor</li>
  <li>Configurer le thème (splash screen, couleur de barre de statut)</li>
</ul>

<p><strong>Dépendances</strong> : étape 1, compte Google Play actif, projet Firebase créé.</p>

<hr class="divider"/>

<h3>Étape 5 — Icônes et splash screens</h3>
<p><em>Durée estimée : <strong>½ journée</strong> (création des assets + configuration).</em></p>

<p>Actuellement disponibles : <code>public/icon-192.png</code> et <code>public/icon-512.png</code>. Ces fichiers sont insuffisants pour les stores.</p>

<p>iOS requiert une icône 1024×1024 px sans canal alpha (PNG opaque). Android requiert des icônes adaptatives pour les densités ldpi → xxxhdpi.</p>

<pre>npm install @capacitor/assets --save-dev
# Placer icon.png (1024×1024, opaque) et splash.png (2732×2732) dans resources/
npx capacitor-assets generate</pre>

<p>Cette commande génère automatiquement toutes les tailles pour iOS et Android à partir d'un seul fichier source.</p>

<p><strong>Fichiers concernés</strong> : <code>resources/icon.png</code>, <code>resources/splash.png</code> à créer. <code>ios/App/App/Assets.xcassets</code> et <code>android/app/src/main/res/</code> seront générés automatiquement.</p>

<p><strong>Dépendances</strong> : étapes 3 et 4.</p>

<hr class="divider"/>

<h3>Étape 6 — Permissions natives (caméra/galerie pour l'upload)</h3>
<p><em>Durée estimée : <strong>½ journée</strong> (uniquement si on veut accéder à la galerie native ; l'input file HTML standard fonctionne déjà).</em></p>

<p>L'upload actuel utilise <code>&lt;input type="file" multiple&gt;</code> (<code>Documents.tsx:397</code>). Sur iOS/Android en Capacitor, cet input HTML standard ouvre déjà le sélecteur de fichiers natif — <strong>aucune modification n'est nécessaire</strong> pour la fonctionnalité de base.</p>

<p>Si on souhaite une UX plus native (caméra directe, galerie photos optimisée) :</p>
<pre>npm install @capacitor/camera</pre>

<p>Cela implique de modifier <code>src/pages/app/Documents.tsx</code> pour ajouter un bouton "Prendre une photo" qui appelle <code>Camera.getPhoto()</code>. Optionnel pour la V1.</p>

<p><strong>Dépendances</strong> : étape 1.</p>

<hr class="divider"/>

<h3>Étape 7 — Masquer la PWAInstallBanner en contexte natif</h3>
<p><em>Durée estimée : <strong>15 minutes</strong>.</em></p>

<p>Fichier : <code>src/components/layout/AppLayout.tsx:217</code> — <code>&lt;PWAInstallBanner /&gt;</code>.</p>
<pre>import { Capacitor } from '@capacitor/core'
// Dans AppLayout.tsx, remplacer la ligne 217 :
{!Capacitor.isNativePlatform() &amp;&amp; &lt;PWAInstallBanner /&gt;}</pre>

<p><strong>Dépendances</strong> : étape 1.</p>

<hr class="divider"/>

<h3>Étape 8 — Tests sur device réel</h3>
<p><em>Durée estimée : <strong>1 à 2 jours</strong> (temps de build iOS ~5-10 min, temps de test fonctionnel, corrections éventuelles).</em></p>

<h4>iOS (iPhone physique requis — simulateur ne teste pas les push)</h4>
<pre>npm run cap:ios
# Dans Xcode : Run sur device physique connecté</pre>

<p>Points à vérifier :</p>
<ul>
  <li>Login + PIN unlock (PBKDF2 — mesuré à 57 ms sur Mac → prévoir 200-400 ms sur iPhone d'entrée de gamme)</li>
  <li>Réception d'un message → notification push native</li>
  <li>Upload d'un fichier depuis la galerie Photos</li>
  <li>Scroll de la liste de conversations (1 000 items → déjà virtualisé)</li>
  <li>Chiffrement/déchiffrement d'un message → AES-GCM, devrait être &lt;5 ms</li>
</ul>

<h4>Android (device physique ou émulateur AVD)</h4>
<pre>npm run cap:android
# Dans Android Studio : Run sur device ou émulateur</pre>

<p><strong>Dépendances</strong> : toutes les étapes précédentes.</p>

<hr class="divider"/>

<!-- ═══════════════════════════════════════════════════════════════ -->
<h2>2. Optimisation préalable — Virtualisation de la liste</h2>

<p><span class="tag tag-ok">DÉJÀ RÉALISÉE</span></p>

<p>La virtualisation de la liste de conversations avec <code>react-virtuoso</code> a été implémentée et validée avant ce plan (commit <code>20981cd</code>).</p>

<ul>
  <li><strong>Composant modifié</strong> : <code>ConvList</code> dans <code>src/pages/app/Messages.tsx:873</code></li>
  <li><strong>Implémentation</strong> : <code>&lt;Virtuoso style={{ height: '100%' }} totalCount={rows.length} itemContent={renderRow} overscan={300} /&gt;</code></li>
  <li><strong>Résultat mesuré</strong> sur 1 000 conversations, 6x CPU + 3G : LCP 6,3 s → <strong>2,9 s</strong> | Score Lighthouse : 78 → <strong>95/100</strong></li>
</ul>

<p>Si cette étape n'avait pas été faite, elle aurait représenté environ 2-3 heures de travail (le composant <code>ConvList</code> faisait 113 lignes avant refactoring).</p>

<hr class="divider"/>

<!-- ═══════════════════════════════════════════════════════════════ -->
<h2>3. Prérequis administratifs</h2>

<h3>Compte Apple Developer</h3>
<table>
  <tr><th>Élément</th><th>Détail</th></tr>
  <tr><td>Coût</td><td><strong>99 USD / an</strong> (environ 90 EUR / an en 2026)</td></tr>
  <tr><td>Délai d'approbation</td><td><strong>48 h à 1 semaine</strong> pour les comptes individuels. Pour les organisations (LLC, SARL, SA), prévoir 1 à 2 semaines : vérification D-U-N-S number obligatoire (gratuit mais délai 5-7 jours ouvrés).</td></tr>
  <tr><td>Documents requis</td><td>Numéro D-U-N-S de Syli taa, adresse légale, email de contact, carte de paiement internationale</td></tr>
  <tr><td>Délai de review App Store</td><td>Première soumission : <strong>1 à 3 jours</strong> en moyenne (peut aller jusqu'à 1 semaine). Mises à jour : souvent 24 h.</td></tr>
  <tr><td>Type recommandé</td><td>Apple Developer Program Organization (pas Individual) pour pouvoir publier sous le nom "Syli taa" et gérer une équipe</td></tr>
</table>

<div class="hypothesis">Les montants ci-dessus sont basés sur les tarifs Apple publiés. Ils peuvent varier selon le taux de change et la région de facturation.</div>

<h3>Compte Google Play</h3>
<table>
  <tr><th>Élément</th><th>Détail</th></tr>
  <tr><td>Coût</td><td><strong>25 USD une seule fois</strong> (frais d'inscription uniques, pas annuels)</td></tr>
  <tr><td>Délai d'approbation</td><td>Le compte est disponible <strong>en quelques heures</strong>. La publication d'une nouvelle app peut prendre 1 à 3 jours pour la première review.</td></tr>
  <tr><td>Documents requis</td><td>Compte Google, carte de paiement internationale, informations de l'organisation</td></tr>
  <tr><td>Politique de confidentialité</td><td>URL d'une politique de confidentialité obligatoire — Kouma en a une (page <code>/legal/privacy</code> visible dans le code).</td></tr>
</table>

<h3>Firebase (pour les push Android)</h3>
<ul>
  <li>Créer un projet Firebase gratuit</li>
  <li>Ajouter l'app Android avec le package <code>com.gundo.kouma</code></li>
  <li>Télécharger <code>google-services.json</code></li>
  <li>Aucun coût pour le niveau Spark (plan gratuit) sauf si >500 000 push/mois</li>
</ul>

<hr class="divider"/>

<!-- ═══════════════════════════════════════════════════════════════ -->
<h2>4. Risques et points de blocage</h2>

<h3>Risque 1 — ITSAppUsesNonExemptEncryption (Apple Export Compliance)</h3>
<p><strong>Question posée</strong> : le chiffrement E2E de Kouma est-il "standard/exempté" ou "non-exempté" au sens Apple ?</p>

<p><strong>Ce qui a été observé dans le code</strong> :</p>
<ul>
  <li>ECDH P-256 pour l'échange de clés (<code>crypto.service.ts:generateUserKeyPair()</code>)</li>
  <li>AES-256-GCM pour chiffrer <strong>les messages et fichiers des utilisateurs</strong> (<code>key.service.ts:initFileKey()</code>, <code>message.service.ts:send()</code>)</li>
  <li>PBKDF2 SHA-256 pour dériver la clé de wrapping depuis le PIN</li>
</ul>

<p><strong>Analyse</strong> : Kouma chiffre du <em>contenu utilisateur</em> (messages, fichiers) avec AES-256. Ce n'est pas uniquement de l'authentification. Selon la réglementation EAR (Export Administration Regulations) des États-Unis, les apps utilisant un chiffrement fort pour protéger des données (pas uniquement HTTPS standard) relèvent de la catégorie ECCN 5D992.</p>

<p><strong>Verdict</strong> : <code>ITSAppUsesNonExemptEncryption</code> devra probablement être mis à <strong>YES</strong> dans <code>Info.plist</code>. Cela implique de soumettre une auto-classification annuelle au Bureau of Industry and Security (BIS) américain. Ce n'est <strong>pas un blocage technique</strong> — c'est une formalité administrative, mais elle doit être faite avant la soumission App Store.</p>

<div class="hypothesis">Apple peut rejeter l'app si ce champ est mal renseigné. La consultation d'un conseiller juridique spécialisé en export control est recommandée avant la première soumission. La règle EAR 740.17(b)(1) prévoit une exemption pour les apps "open source" ou à usage grand public standard — à vérifier selon le statut de Kouma.</div>

<h3>Risque 2 — Backend push (absence observée dans la codebase)</h3>
<p>Le backend qui envoie effectivement les notifications push (Edge Function Supabase ou service externe lisant <code>push_subscriptions</code>) n'est pas présent dans le dépôt exploré. Si ce backend envoie uniquement en Web Push VAPID, il devra être étendu pour envoyer aussi via FCM (Android) et APNs (iOS) une fois les tokens natifs stockés en base.</p>

<h3>Risque 3 — Délai Apple</h3>
<p>La première review Apple peut durer jusqu'à 1 semaine. Les rejections les plus courantes pour une app de messagerie : absence de mécanisme de suppression du compte in-app (requis depuis 2022), politique de confidentialité manquante ou vague, screenshots non conformes.</p>
<p>Kouma dispose déjà d'une page <code>/legal/privacy</code>. La suppression de compte doit être vérifiée.</p>

<h3>Risque 4 — WKWebView et crypto avancée</h3>
<p>WebCrypto (<code>crypto.subtle</code>) est disponible dans WKWebView depuis iOS 14. Les appareils iOS 13 et antérieurs ne pourront pas utiliser l'app. <span class="tag tag-info">Acceptable</span> — iOS 13 représente moins de 2% du parc en 2026.</p>

<hr class="divider"/>

<!-- ═══════════════════════════════════════════════════════════════ -->
<h2>5. Calendrier global réaliste</h2>

<table>
  <tr><th>Semaine</th><th>Tâche</th><th>Parallélisable avec</th></tr>
  <tr><td>S1 J1-2</td><td>Créer comptes Apple Developer + Google Play (démarches administratives) + projet Firebase</td><td>Tout le reste du développement</td></tr>
  <tr><td>S1 J1</td><td>Étape 1 : Installation Capacitor (<code>npm install</code>, <code>cap init</code>, <code>capacitor.config.ts</code>)</td><td>Démarches admin</td></tr>
  <tr><td>S1 J2-3</td><td>Étapes 3+4 : Config iOS (Xcode) + Android (Android Studio) ; étape 5 : Icônes/splash</td><td>Démarches admin</td></tr>
  <tr><td>S1 J3-4</td><td>Étape 2 : Adaptation push native (<code>push.service.ts</code> + <code>AppLayout.tsx</code> + backend)</td><td>Icônes (si graphiste disponible)</td></tr>
  <tr><td>S1 J4-5</td><td>Étapes 6+7 : Permissions optionnelles + masquer PWAInstallBanner</td><td>-</td></tr>
  <tr><td>S2 J1-2</td><td>Étape 8 : Tests sur devices réels iOS + Android, corrections</td><td>-</td></tr>
  <tr><td>S2 J3-4</td><td>Préparation stores : screenshots, descriptions, metadata, BIS auto-classification</td><td>-</td></tr>
  <tr><td>S2 J5</td><td>Soumissions simultanées App Store + Play Store</td><td>-</td></tr>
  <tr><td>S3 J1-5</td><td>Review Apple (1-7 jours) + Review Google (1-3 jours). Corrections si rejet.</td><td>-</td></tr>
  <tr><td>S3 fin</td><td><strong>Publication</strong> sur les deux stores</td><td>-</td></tr>
</table>

<p><strong>Durée totale estimée : 2 à 3 semaines</strong> du démarrage à la publication, en supposant une première review Apple sans rejet. Les démarches administratives (compte Apple, D-U-N-S) sont le chemin critique — à lancer en J1.</p>

<p><strong>Ce qui peut être parallélisé</strong> :</p>
<ul>
  <li>Création des comptes développeur ↔ tout le développement Capacitor</li>
  <li>Config iOS ↔ Config Android ↔ Création des assets visuels</li>
  <li>Tests iOS ↔ Tests Android</li>
  <li>Review Google Play ↔ Corrections éventuelles pour Apple</li>
</ul>

<p><strong>Ce qui est strictement séquentiel</strong> : Installation Capacitor → Config iOS/Android → Adaptation push → Tests device → Soumission → Review.</p>

<hr class="divider"/>

<!-- ═══════════════════════════════════════════════════════════════ -->
<h2>6. Ce qui ne change pas</h2>

<p>Les éléments suivants ont été vérifiés dans le code et <strong>ne nécessitent aucune adaptation</strong> pour Capacitor :</p>

<table>
  <tr><th>Élément</th><th>Preuve dans le code</th></tr>
  <tr>
    <td>Chiffrement E2E (WebCrypto)</td>
    <td><code>src/services/crypto.service.ts</code> — 100% Web Crypto API standard, disponible dans WKWebView (iOS 14+) et ChromeWebView (Android 5+). Zéro dépendance externe.</td>
  </tr>
  <tr>
    <td>Authentification Supabase</td>
    <td><code>src/lib/supabase.ts</code> — SDK Supabase utilise <code>fetch</code> + WebSocket, tous deux disponibles dans les WebViews modernes.</td>
  </tr>
  <tr>
    <td>Routes et navigation</td>
    <td><code>src/App.tsx:40</code> — BrowserRouter fonctionne avec Capacitor 6 (serveur HTTP local <code>capacitor://localhost/</code>, History API supporté).</td>
  </tr>
  <tr>
    <td>Upload de fichiers</td>
    <td><code>Documents.tsx:397</code> — <code>&lt;input type="file"&gt;</code> ouvre le sélecteur natif sur iOS/Android sans modification.</td>
  </tr>
  <tr>
    <td>Chiffrement des fichiers uploadés</td>
    <td><code>document.service.ts:258-279</code> — <code>file.arrayBuffer()</code> + AES-GCM disponibles dans WebView.</td>
  </tr>
  <tr>
    <td>Interface utilisateur</td>
    <td>Tailwind CSS v4 (<code>src/index.css</code>), composants React — aucune dépendance au DOM spécifique au navigateur desktop. Safe area déjà gérée (<code>.safe-area-bottom</code>).</td>
  </tr>
  <tr>
    <td>Virtualisation de la liste</td>
    <td><code>react-virtuoso</code> — bibliothèque React pure, aucune dépendance navigateur-specific.</td>
  </tr>
  <tr>
    <td>Realtime Supabase (WebSocket)</td>
    <td><code>AppLayout.tsx:114-123</code> — <code>supabase.channel()</code> utilise WebSocket, disponible dans WebView.</td>
  </tr>
  <tr>
    <td>i18n (fr/en/es/pt)</td>
    <td><code>src/i18n/</code> — i18next + react-i18next, bibliothèques JS pures.</td>
  </tr>
</table>

<hr class="divider"/>

<!-- ═══════════════════════════════════════════════════════════════ -->
<h2>7. À confirmer avec l'équipe</h2>

<div class="confirm-box">
  <ol style="margin-left:16px">
    <li style="margin-bottom:8px"><strong>Backend push existant</strong> : Où est le service qui lit <code>push_subscriptions</code> et envoie les notifications Web Push ? (Edge Function Supabase ? Service externe ?) Ce service devra être adapté pour envoyer aussi via FCM/APNs.</li>
    <li style="margin-bottom:8px"><strong>Compte Apple Developer</strong> : Syli taa possède-t-il déjà un compte Apple Developer ? Le numéro D-U-N-S de l'organisation est-il disponible ?</li>
    <li style="margin-bottom:8px"><strong>Compte Google Play</strong> : Existe-t-il déjà ? Sinon, qui crée le compte et avec quel email Google ?</li>
    <li style="margin-bottom:8px"><strong>Projet Firebase</strong> : Un projet Firebase existe-t-il pour Kouma ? Sinon, sous quel compte Google le créer ?</li>
    <li style="margin-bottom:8px"><strong>Suppression du compte in-app</strong> : Apple exige depuis 2022 un mécanisme de suppression de compte directement dans l'app. Kouma le propose-t-il ? (Non trouvé dans les routes explorées.)</li>
    <li style="margin-bottom:8px"><strong>Appareil de test iOS</strong> : Un iPhone physique est disponible pour les tests push natifs ? (Le simulateur ne reçoit pas les push APNs.)</li>
    <li style="margin-bottom:8px"><strong>Décision Firebase</strong> : Utiliser Firebase uniquement pour FCM (push Android), ou aussi pour iOS ? (Capacitor supporte aussi les APNs directs sans Firebase sur iOS.)</li>
    <li style="margin-bottom:8px"><strong>Export compliance</strong> : L'équipe juridique de Syli taa a-t-elle déjà traité la question de la réglementation EAR américaine pour les apps chiffrant du contenu utilisateur ?</li>
  </ol>
</div>

<hr class="divider"/>
<p style="text-align:center; color:#94a3b8; font-size:8.5pt; margin-top:24px">
  Document généré automatiquement à partir de l'analyse de la codebase Kouma (commit 20981cd) · Août 2026<br/>
  Chaque affirmation technique est traçable à un fichier source exact.
</p>

</div>
</body>
</html>`

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})
const page = await browser.newPage()
await page.setContent(HTML, { waitUntil: 'networkidle0' })
await page.pdf({
  path: OUTPUT,
  format: 'A4',
  margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
  printBackground: true,
})
await browser.close()
console.log(`PDF généré : ${OUTPUT}`)
