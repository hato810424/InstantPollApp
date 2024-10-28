import ngrok from "@ngrok/ngrok";

(async function () {
  // Establish connectivity
  const listener = await ngrok.forward({ addr: 3000, authtoken_from_env: true });

  // Output ngrok url to console
  console.log(`Ingress established at: ${listener.url()}`);
})();

process.stdin.resume();
