<template>
  <router-view />
</template>

<script setup></script>

<style>
/* CSS変数 */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-tertiary: #e9ecef;
  --text-primary: #212529;
  --text-secondary: #6c757d;
  --border-color: #212529;
  --accent-color: #495057;
  --success-color: #198754;
  --preview-bg: #495057;
}

/* リセット */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* ベース設定 */
body {
  font-family: "Zen Kaku Gothic New", sans-serif;
  /* background: var(--bg-secondary); */
  color: var(--text-primary);
  min-height: 100vh;
  line-height: 1.6;
}

#app {
  width: 100%;
  min-height: 100vh;
}

/* すべての角丸を削除 */
*,
*::before,
*::after {
  border-radius: 0 !important;
}
</style>
