// Stripe Checkout and the billing portal must open as a top-level page. The
// builder preview runs the app inside an iframe, so a tab is opened
// synchronously in the click handler — before the session is requested — to
// keep the user activation and survive popup blockers. Top-level, the page
// navigates itself.
export async function openStripePage(createUrl) {
  const framed = window.self !== window.top;
  const tab = framed ? window.open('', '_blank') : null;
  if (framed && !tab) throw new Error('Allow popups to continue to checkout.');
  if (tab) tab.opener = null;

  try {
    const url = await createUrl();
    if (tab) {
      tab.location.replace(url);
    } else {
      window.location.assign(url);
    }
  } catch (error) {
    if (tab) tab.close();
    throw error;
  }
}