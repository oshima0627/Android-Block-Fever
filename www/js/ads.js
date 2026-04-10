let admobAvailable = false;
let bannerShowing = false;

const AD_IDS = {
  banner: 'ca-app-pub-4718076434751586/8180818511',
  interstitial: 'ca-app-pub-4718076434751586/2032769609',
  rewarded: 'ca-app-pub-4718076434751586/7999412159'
};

async function getAdMob() {
  if (typeof window.Capacitor === 'undefined') return null;
  try {
    const { AdMob } = await import('@capacitor-community/admob');
    return AdMob;
  } catch (e) {
    return null;
  }
}

export async function initAds() {
  const AdMob = await getAdMob();
  if (!AdMob) {
    console.log('AdMob not available (running in browser or plugin missing)');
    return;
  }

  try {
    await AdMob.initialize({
      requestTrackingAuthorization: true,
      initializeForTesting: false
    });
    admobAvailable = true;
    console.log('AdMob initialized');
  } catch (e) {
    console.warn('AdMob init failed:', e);
  }
}

export async function showBanner() {
  if (!admobAvailable || bannerShowing) return;
  const AdMob = await getAdMob();
  if (!AdMob) return;

  try {
    await AdMob.showBanner({
      adId: AD_IDS.banner,
      adSize: 'BANNER',
      position: 'BOTTOM_CENTER',
      margin: 0,
      isTesting: false
    });
    bannerShowing = true;
  } catch (e) {
    console.warn('Banner show failed:', e);
  }
}

export async function hideBanner() {
  if (!admobAvailable || !bannerShowing) return;
  const AdMob = await getAdMob();
  if (!AdMob) return;

  try {
    await AdMob.hideBanner();
    bannerShowing = false;
  } catch (e) {
    console.warn('Banner hide failed:', e);
  }
}

export async function showInterstitial() {
  if (!admobAvailable) return;
  const AdMob = await getAdMob();
  if (!AdMob) return;

  try {
    await AdMob.prepareInterstitial({
      adId: AD_IDS.interstitial,
      isTesting: false
    });
    await AdMob.showInterstitial();
  } catch (e) {
    console.warn('Interstitial failed:', e);
  }
}

export async function showRewarded(onReward) {
  if (!admobAvailable) {
    if (onReward) onReward();
    return;
  }
  const AdMob = await getAdMob();
  if (!AdMob) {
    if (onReward) onReward();
    return;
  }

  try {
    await AdMob.prepareRewardVideoAd({
      adId: AD_IDS.rewarded,
      isTesting: false
    });

    const handler = AdMob.addListener('onRewardedVideoAdReward', () => {
      handler.remove();
      if (onReward) onReward();
    });

    await AdMob.showRewardVideoAd();
  } catch (e) {
    console.warn('Rewarded ad failed:', e);
  }
}
