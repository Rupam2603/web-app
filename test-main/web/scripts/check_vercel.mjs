async function check() {
  const res = await fetch('https://shop-phi-plum.vercel.app/');
  const html = await res.text();
  console.log('HTML snippet:', html.slice(0, 300));
  const matches = [...html.matchAll(/src="([^"]+\.js)"/g)];
  for (const match of matches) {
    const jsUrl = new URL(match[1], 'https://shop-phi-plum.vercel.app/').href;
    console.log('Fetching JS:', jsUrl);
    const js = await (await fetch(jsUrl)).text();
    console.log('Vercel has ep-falling-cell:', js.includes('ep-falling-cell'));
    console.log('Vercel has ep-divine-scene:', js.includes('ep-divine-scene'));
  }
}
check().catch(console.error);
