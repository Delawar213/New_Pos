/** Runs before paint to avoid light flash when dark mode is saved. */
export function ThemeScript() {
  const script = `(function(){try{var k=${JSON.stringify("flexpos-theme")};var t=localStorage.getItem(k);var d=false;if(t==="dark")d=true;else if(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches)d=true;var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}