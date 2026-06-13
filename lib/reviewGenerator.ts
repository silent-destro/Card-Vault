// Dynamic, randomized review generator for CardVault
// Generates unique reviews for English, Hindi, and Gujarati with thousands of combinations to guarantee uniqueness.

export interface ReviewVariants {
  short: string;
  detailed: string;
  story: string;
}

const USED_SHORTS = new Set<string>();
const USED_DETAILED = new Set<string>();
const USED_STORIES = new Set<string>();

// Helper to get random item from array
function getRand(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function clearReviewCache() {
  USED_SHORTS.clear();
  USED_DETAILED.clear();
  USED_STORIES.clear();
}

export function generateDynamicReview(params: {
  businessName: string;
  category?: string;
  stars: number;
  tone: string;
  tags: string[];
  language: string;
  excludeShorts?: Set<string>;
  excludeDetaileds?: Set<string>;
  excludeStories?: Set<string>;
}): ReviewVariants {
  const { businessName, category, stars, tone, tags, language } = params;
  const activeExcludeShorts = params.excludeShorts || USED_SHORTS;
  const activeExcludeDetaileds = params.excludeDetaileds || USED_DETAILED;
  const activeExcludeStories = params.excludeStories || USED_STORIES;

  // Handle default tags if empty
  const activeTags = tags && tags.length > 0
    ? tags
    : language === "hi"
    ? ["उत्कृष्ट सेवा", "विनम्र व्यवहार", "वाजिब दाम", "तेज रिस्पॉन्स", "शानदार क्वालिटी"]
    : language === "gu"
    ? ["ઉત્તમ સેવા", "નમ્ર સ્ટાફ", "વ્યાજબી ભાવ", "ઝડપી કામ", "સરસ ક્વોલિટી"]
    : ["Quality Service", "Friendly Staff", "Reasonable Price", "Prompt Response", "Excellent Quality"];

  let attempts = 0;
  const maxAttempts = 200;

  while (attempts < maxAttempts) {
    attempts++;
    let result: ReviewVariants;

    if (language === "hi") {
      result = generateHindiReview(businessName, stars, tone, activeTags);
    } else if (language === "gu") {
      result = generateGujaratiReview(businessName, stars, tone, activeTags);
    } else {
      result = generateEnglishReview(businessName, stars, tone, activeTags);
    }

    // Normalize for comparison by removing businessName
    const normShort = result.short.replace(businessName, "BUSINESS");
    const normDetailed = result.detailed.replace(businessName, "BUSINESS");
    const normStory = result.story.replace(businessName, "BUSINESS");

    // Check if any variant is a duplicate
    if (
      !activeExcludeShorts.has(normShort) &&
      !activeExcludeDetaileds.has(normDetailed) &&
      !activeExcludeStories.has(normStory)
    ) {
      activeExcludeShorts.add(normShort);
      activeExcludeDetaileds.add(normDetailed);
      activeExcludeStories.add(normStory);
      return result;
    }
  }

  // Fallback if we hit max attempts (highly unlikely with thousands of combinations)
  const randSuffix = Math.floor(Math.random() * 1000000);
  return language === "hi"
    ? {
        short: `बहुत बढ़िया अनुभव! ${businessName} की सर्विस बेहद सराहनीय है। [Ref: ${randSuffix}]`,
        detailed: `मैंने हाल ही में ${businessName} की सेवाएं लीं। स्टाफ बहुत ही पेशेवर है और काम की क्वालिटी बेहतरीन थी। मैं निश्चित रूप से दूसरों को भी यहाँ जाने का सुझाव दूँगा। [Ref: ${randSuffix}]`,
        story: `मुझे एक मित्र ने ${businessName} के बारे में बताया था। जब मैं वहाँ गया तो काम की गति और क्वालिटी देखकर दंग रह गया। बहुत ही अच्छा स्टाफ है। [Ref: ${randSuffix}]`
      }
    : language === "gu"
    ? {
        short: `ખૂબ જ સરસ સર્વિસ! ${businessName} નું કામ ખરેખર પ્રશંસનીય છે. [Ref: ${randSuffix}]`,
        detailed: `મને ${businessName} ખાતે ઘણો સારો અનુભવ મળ્યો છે. ત્યાંના લોકો ખૂબ જ નમ્ર અને પોતાના કામમાં હોશિયાર છે. કિંમત પણ વ્યાજબી છે. [Ref: ${randSuffix}]`,
        story: `હું કોઈ કામ માટે ${businessName} ની મુલાકાત લીધી હતી. ત્યાં જઈને સર્વિસ જોઈને હું ઘણો પ્રભાવિત થયો. ભવિષ્યમાં પણ હું અહીં જ જવાનું પસંદ કરીશ. [Ref: ${randSuffix}]`
      }
    : {
        short: `Excellent experience! The team at ${businessName} was highly professional. [Ref: ${randSuffix}]`,
        detailed: `I recently visited ${businessName} and was extremely pleased with their service. The team was supportive, friendly, and delivered exactly what I needed. Highly recommend! [Ref: ${randSuffix}]`,
        story: `I was looking for a reliable place and a friend recommended ${businessName}. From the start, they were very welcoming and handled everything with absolute care. I will be a returning customer! [Ref: ${randSuffix}]`
      };
}

function generateEnglishReview(
  businessName: string,
  stars: number,
  tone: string,
  tags: string[]
): ReviewVariants {
  const adverbs = ["really", "absolutely", "truly", "exceptionally", "incredibly", "extremely", "genuinely", "highly", "delightfully", "wonderfully"];
  const adjectives = ["fantastic", "wonderful", "amazing", "professional", "stellar", "superb", "excellent", "outstanding", "great", "top-notch", "splendid"];
  const emojis = ["😊", "✨", "👍", "🙌", "⭐", "👌", "🔥", "💯", "🎉", "🌟"];

  const adv = getRand(adverbs);
  const adj = getRand(adjectives);
  const emo = getRand(emojis);

  // Pick 1-2 random tags
  const tagStr = tags.slice(0, 2).join(" and ");

  // Short Review Generation
  const shortIntros = [
    `Had a ${adv} ${adj} experience at ${businessName}`,
    `Absolutely loved my visit to ${businessName}`,
    `Top-tier work and great customer care at ${businessName}`,
    `Highly impressed by ${businessName} and their team`,
    `Superb quality and warm hospitality from ${businessName}`,
    `The service at ${businessName} is ${adv} ${adj}`,
    `Such an amazing experience with ${businessName}`,
    `Really pleased with ${businessName} and their setup`,
    `Incredible results from ${businessName}`,
    `Absolutely outstanding work by ${businessName}`
  ];

  const shortTags = [
    `their ${tagStr.toLowerCase()} was top-tier`,
    `the ${tagStr.toLowerCase()} stood out immediately`,
    `specially happy with the ${tagStr.toLowerCase()}`,
    `they really nailed the ${tagStr.toLowerCase()}`,
    `excellent attention to ${tagStr.toLowerCase()}`,
    `everything, especially the ${tagStr.toLowerCase()}, was perfect`,
    `their focus on ${tagStr.toLowerCase()} is remarkable`,
    `the team's approach to ${tagStr.toLowerCase()} is perfect`
  ];

  const shortClosings = [
    `Highly recommended!`,
    `Will definitely return.`,
    `Five stars all the way!`,
    `Keep up the great work!`,
    `Definitely worth checking out.`,
    `A must-visit place!`,
    `Super happy customer here.`,
    `Cannot recommend them enough!`,
    `Very pleased with everything.`,
    `Will recommend to all.`
  ];

  const short = `${getRand(shortIntros)}! ${getRand(shortTags)}. ${getRand(shortClosings)} ${emo}`;

  // Detailed Review Generation
  const s1 = [
    `I recently visited ${businessName} and was ${adv} pleased with the results.`,
    `My experience at ${businessName} was ${adv} ${adj} from start to finish.`,
    `I had a ${adv} ${adj} time during my visit to ${businessName}.`,
    `The staff at ${businessName} is extremely ${adj} and welcoming.`,
    `If you are looking for top-tier service, ${businessName} is the place to go.`,
    `I had the pleasure of visiting ${businessName} and it was ${adv} ${adj}.`
  ];

  const s2 = [
    `They paid close attention to ${tagStr.toLowerCase()}, which made all the difference.`,
    `The ${tagStr.toLowerCase()} was handled with utmost professionalism and care.`,
    `I was particularly impressed by the quality of their ${tagStr.toLowerCase()}.`,
    `Their expertise in ${tagStr.toLowerCase()} is clearly visible in their work.`,
    `They really went above and beyond when it came to ${tagStr.toLowerCase()}.`,
    `No doubt their execution of ${tagStr.toLowerCase()} is the best in the market.`
  ];

  const s3 = [
    `The staff was polite, polite, and made sure all my requirements were handled properly.`,
    `Everything was clean, organized, and the process was extremely smooth.`,
    `The communication was crystal clear and they were very transparent about everything.`,
    `They are very knowledgeable and answered all of my questions patiently.`,
    `The level of detail and dedication they put into their work is rare to find.`,
    `They treat every client with respect and ensure absolute satisfaction.`
  ];

  const s4 = [
    `I will definitely be returning and recommending them to my family and friends.`,
    `This is easily the best place in town for these services.`,
    `I highly recommend ${businessName} to anyone looking for premium quality.`,
    `You won't be disappointed if you decide to choose them.`,
    `A solid five-star rating well-deserved for their hard work.`,
    `A perfect 10/10 experience in every department.`
  ];

  const detailed = `${getRand(s1)} ${getRand(s2)} ${getRand(s3)} ${getRand(s4)}`;

  // Story Review Generation (Expanded and Dynamic)
  const story1 = [
    `A close friend recommended ${businessName} to me last week when I was looking for help.`,
    `I stumbled upon ${businessName} online while searching for the best local providers.`,
    `I've been looking for a reliable business for a while and finally decided to try ${businessName}.`,
    `I had an urgent requirement and reached out to ${businessName} after reading great reviews.`,
    `I was passing by and decided to stop at ${businessName} to see their offerings.`,
    `During my search for a professional team, I came across ${businessName} and booked an appointment.`,
    `I've visited several places, but my colleague suggested ${businessName} was the absolute best.`,
    `After hearing so many good things about ${businessName}, I decided to check it out myself yesterday.`
  ];

  const story2 = [
    `From the moment I walked in, the team made me feel welcome. We discussed my needs, focusing on ${tagStr.toLowerCase()}, and they got to work.`,
    `The team listened carefully to my requirements. They explained everything clearly and put special effort into ${tagStr.toLowerCase()}.`,
    `They were extremely polite and professional. They showed me all options and paid attention to ${tagStr.toLowerCase()}.`,
    `I was greeted with warm smiles. The service was prompt, and they handled ${tagStr.toLowerCase()} with absolute care.`,
    `The atmosphere was very pleasant. They understood exactly what I wanted and delivered outstanding ${tagStr.toLowerCase()}.`,
    `The check-in was seamless. The consultant took their time to understand my preferences regarding ${tagStr.toLowerCase()} and did a ${adv} good job.`,
    `They welcomed me with a nice gesture. We spent some time outlining the details of ${tagStr.toLowerCase()} and they executed it flawlessly.`,
    `I was surprised by their friendly reception. They immediately picked up my hints on ${tagStr.toLowerCase()} and handled it with high expertise.`
  ];

  const story3 = [
    `The end result was even better than I expected. I left with a big smile and will definitely be a regular here.`,
    `I am so happy with how it turned out. They exceeded my expectations in every way possible. Highly recommended!`,
    `It is rare to find such consistent quality and dedication. I will be telling everyone about my experience.`,
    `They saved me so much time and effort. I'm incredibly grateful for their help and will be back soon.`,
    `This experience completely won me over. They have definitely earned my trust and repeat business.`,
    `I walked out feeling extremely satisfied. It was worth every single penny and more.`,
    `They have set a new standard for customer service. I am thoroughly impressed and will be a repeat customer.`,
    `A truly wonderful experience. I will definitely refer my entire network to them.`
  ];

  const story = `${getRand(story1)} ${getRand(story2)} ${getRand(story3)}`;

  return { short, detailed, story };
}

function generateHindiReview(
  businessName: string,
  stars: number,
  tone: string,
  tags: string[]
): ReviewVariants {
  const adverbs = ["सचमुच", "वाकई", "बहुत ही", "बेहद", "काफी", "बिलकुल", "अत्यंत", "दिल से", "पूर्ण रूप से"];
  const adjectives = ["शानदार", "बेहतर", "कमाल का", "अद्भुत", "उत्कृष्ट", "सराहनीय", "लाजवाब", "सुपर", "बेमिसाल"];
  const emojis = ["😊", "✨", "👍", "🙌", "⭐", "👌", "🔥", "💯", "🎉", "🌟"];

  const adv = getRand(adverbs);
  const adj = getRand(adjectives);
  const emo = getRand(emojis);

  const tagStr = tags.slice(0, 2).join(" और ");

  // Short Review Generation
  const shortIntros = [
    `मुझे ${businessName} से ${adv} ${adj} सर्विस मिली`,
    `अगर आप बेहतरीन ${tagStr} चाहते हैं, तो ${businessName} सबसे सही जगह है`,
    `${businessName} पर जाना मेरे लिए ${adv} सुखद अनुभव रहा`,
    `${businessName} के काम की क्वालिटी वाकई ${adj} है`,
    `${businessName} की टीम और उनका काम ${adv} प्रशंसनीय है`,
    `सर्वोत्तम सर्विस और विनम्र व्यवहार के लिए ${businessName} बेस्ट है`,
    `${businessName} में काम करने का स्टाइल ${adv} ${adj} है`
  ];

  const shortTags = [
    `उनका ${tagStr} काफी बढ़िया था`,
    `विशेषकर ${tagStr} ने मेरा दिल जीत लिया`,
    `यहाँ का ${tagStr} बहुत ही शानदार है`,
    `उनकी टीम ने ${tagStr} को बेहद बखूबी संभाला`,
    `उनकी क्वालिटी और ${tagStr} सबसे बेहतरीन है`
  ];

  const shortClosings = [
    `जरूर दोबारा आएंगे!`,
    `सभी को यहाँ जाने की सलाह दूंगा।`,
    `फाइव स्टार रेटिंग!`,
    `बहुत-बहुत धन्यवाद।`,
    `निश्चित रूप से सबसे अच्छी जगह है।`,
    `काम देखकर मजा आ गया।`,
    `बेस्ट एक्सपीरियंस रहा।`
  ];

  const short = `${getRand(shortIntros)}! ${getRand(shortTags)}। ${getRand(shortClosings)} ${emo}`;

  // Detailed Review
  const s1 = [
    `${businessName} में मेरा अनुभव ${adv} ${adj} था।`,
    `मैंने हाल ही में ${businessName} की सेवा ली और मैं बहुत ही खुश हूँ।`,
    `${businessName} की टीम वाकई बहुत पेशेवर तरीके से काम करती है।`,
    `यदि आप बढ़िया काम चाहते हैं, तो ${businessName} पर एक बार जरूर आएं।`,
    `मुझे खुशी है कि मैंने सर्विस के लिए ${businessName} को चुना।`
  ];

  const s2 = [
    `विशेषकर ${tagStr} की सर्विस बहुत ही उत्तम और गुणवत्तापूर्ण थी।`,
    `उनकी टीम ने ${tagStr} को बहुत अच्छे से और सफाई से मैनेज किया।`,
    `यहाँ का ${tagStr} पूरे शहर में सबसे बेहतरीन और अलग है।`,
    `उन्होंने ${tagStr} के हर एक छोटे से छोटे पहलू पर ध्यान दिया।`,
    `काम में उनका फोकस और ${tagStr} का लेवल कमाल का है।`
  ];

  const s3 = [
    `यहाँ के स्टाफ का व्यवहार बहुत विनम्र है और वे ग्राहकों की हर बात सुनते हैं।`,
    `पूरी सर्विस काफी फास्ट थी और जगह भी बहुत साफ-सुथरी थी।`,
    `काम करने का तरीका बहुत ही व्यवस्थित और पारदर्शी है।`,
    `वे बहुत अनुभवी हैं और अपनी फील्ड में एक्सपर्ट हैं।`,
    `बिना किसी परेशानी के सारा काम समय पर पूरा हो गया।`
  ];

  const s4 = [
    `मैं इस जगह की सभी को पूरे दिल से सिफारिश करता हूँ।`,
    `मैं यहाँ जरूर दोबारा आना पसंद करूँगा।`,
    `काम की क्वालिटी के हिसाब से कीमतें भी बहुत वाजिब हैं।`,
    `5 स्टार से कम तो कुछ बनता ही नहीं है इनके लिए।`,
    `शानदार कस्टमर सपोर्ट और बेहतरीन क्वालिटी का कॉम्बो है ये।`
  ];

  const detailed = `${getRand(s1)} ${getRand(s2)} ${getRand(s3)} ${getRand(s4)}`;

  // Story
  const story1 = [
    `मुझे तत्काल ${tagStr} की जरूरत थी और मेरे दोस्त ने ${businessName} का सुझाव दिया।`,
    `मैं काफी समय से एक अच्छी सर्विस की तलाश में था और मुझे ऑनलाइन ${businessName} के बारे में पता चला।`,
    `शुरुआत में मैं थोड़ा आशंकित था लेकिन फिर मैं खुद ${businessName} गया।`,
    `मैंने कई जगहों पर ट्राई किया था पर संतुष्टि नहीं मिली, फिर मैं ${businessName} पहुँचा।`,
    `कल सुबह मैं अपनी एक बड़ी समस्या के हल के लिए ${businessName} के ऑफिस गया था।`
  ];

  const story2 = [
    `वहाँ पहुँचते ही स्टाफ ने मेरी समस्या सुनी और बहुत अच्छे से गाइड किया। उन्होंने ${tagStr} पर विशेष काम किया।`,
    `उनकी टीम ने पहले मेरी पसंद और बजट को समझा और फिर उसके अनुसार ${tagStr} का बेहतरीन काम करके दिखाया।`,
    `वहाँ का माहौल बहुत पॉजिटिव था और उन्होंने ${tagStr} की सर्विस बहुत ही ध्यान और लगन से दी।`,
    `स्टाफ ने बहुत ही फ्रेंडली तरीके से स्वागत किया और ${tagStr} की प्रक्रिया को आसान बनाया।`,
    `उनके रिसेप्शन से ही मुझे अच्छी वाइब्स मिलीं। उन्होंने ${tagStr} की बारीकियों को समझा और उसे बहुत पेशेवर तरीके से डील किया।`
  ];

  const story3 = [
    `काम पूरा होने के बाद मैं पूरी तरह संतुष्ट था। अब मैं हमेशा यहीं आऊंगा।`,
    `उन्होंने मेरा समय और पैसा दोनों बचाया। मैं सभी को यहाँ आने की सलाह दूंगा।`,
    `यह अनुभव मेरी उम्मीद से कहीं बेहतर था। पूरी टीम का बहुत-बहुत आभार!`,
    `अगर आप भी बेहतरीन सर्विस चाहते हैं तो बिना सोचे यहाँ आएं।`,
    `मैं उनके काम से बेहद प्रभावित हुआ हूँ और अपने सभी रिश्तेदारों को भी यहीं भेजूंगा।`
  ];

  const story = `${getRand(story1)} ${getRand(story2)} ${getRand(story3)}`;

  return { short, detailed, story };
}

function generateGujaratiReview(
  businessName: string,
  stars: number,
  tone: string,
  tags: string[]
): ReviewVariants {
  const adverbs = ["ખરેખર", "ખૂબ જ", "સાચે જ", "તદ્દન", "ઘણું જ", "દિલથી", "અતિશય", "ખાસ કરીને"];
  const adjectives = ["અદ્ભુત", "સુંદર", "ઉત્તમ", "શ્રેષ્ઠ", "સરસ", "નમૂનેદાર", "લાજવાબ", "સુપર", "બેસ્ટ"];
  const emojis = ["😊", "✨", "👍", "🙌", "⭐", "👌", "🔥", "💯", "🎉", "🌟"];

  const adv = getRand(adverbs);
  const adj = getRand(adjectives);
  const emo = getRand(emojis);

  const tagStr = tags.slice(0, 2).join(" અને ");

  // Short Review Generation
  const shortIntros = [
    `${businessName} સાથે ${adv} ${adj} અનુભવ રહ્યો`,
    `જો તમારે શ્રેષ્ઠ ${tagStr} જોઈએ તો ${businessName} થી ઉત્તમ કોઈ નથી`,
    `${businessName} ની સર્વિસ અને તેમનો સ્ટાફ ${adv} સરસ છે`,
    `${businessName} ખાતે કામની ક્વોલિટી ${adv} શ્રેષ્ઠ જોવા મળી`,
    `ઝડપી સેવા અને સંતોષકારક પરિણામ માટે ${businessName} બેસ્ટ છે`,
    `${businessName} ની ટીમ અને તેમનું કામ ${adv} પ્રશંસનીય છે`
  ];

  const shortTags = [
    `તેમનું ${tagStr} નું કામ અદ્ભુત હતું`,
    `ખાસ કરીને ${tagStr} માં ખૂબ જ ચોકસાઈ જોવા મળી`,
    `અહીંનું ${tagStr} ખરેખર પ્રશંસનીય છે`,
    `તેમણે ${tagStr} નું કામ ખૂબ જ સુંદર રીતે કર્યું`,
    `તેમની સેવાની ક્વોલિટી અને ${tagStr} ઉત્કૃષ્ટ છે`
  ];

  const shortClosings = [
    `ચોક્કસ ફરી મુલાકાત લઈશ.`,
    `બધાને અહીં આવવાની ભલામણ કરું છું!`,
    `ખૂબ ખૂબ આભાર.`,
    `બેસ્ટ સર્વિસ, 5 સ્ટાર!`,
    `શહેરમાં સૌથી ઉત્તમ સ્થળ છે.`,
    `મન ખુશ થઈ ગયું કામ જોઈને.`
  ];

  const short = `${getRand(shortIntros)}! ${getRand(shortTags)}। ${getRand(shortClosings)} ${emo}`;

  // Detailed Review
  const s1 = [
    `${businessName} ની મુલાકાત મારા માટે ${adv} ${adj} રહી.`,
    `હું છેલ્લા થોડા સમયથી ${businessName} ની સેવાનો ઉપયોગ કરું છું અને ખૂબ ખુશ છું.`,
    `${businessName} ના લોકો ખૂબ જ વ્યવસાયિક છે અને તેમનું કામ ${adj} છે.`,
    `ઉત્કૃષ્ટ ક્વોલિટી અને સમયસર કામ માટે ${businessName} એકમાત્ર વિકલ્પ છે.`,
    `હું હંમેશા ${businessName} ની મુલાકાત લેવાની સલાહ આપું છું.`
  ];

  const s2 = [
    `ખાસ કરીને તેમનું ${tagStr} નું કામ અજોડ અને વખાણવા લાયક છે.`,
    `તેમણે ${tagStr} ને લગતી મારી તમામ નાની-મોટી જરૂરિયાતો પૂરી કરી.`,
    `તેમનું ધ્યાન અને ${tagStr} ની ગુણવત્તા ખરેખર ઉત્તમ છે.`,
    `ખૂબ જ ઓછી કિંમતમાં તેમણે સુંદર રીતે ${tagStr} નું કામ કરી આપ્યું.`,
    `ગ્રાહકોને સંતોષ આપવો અને ${tagStr} જાળવવું તેમનો ધ્યેય છે.`
  ];

  const s3 = [
    `સ્ટાફ ખૂબ જ વિવેકી છે અને બધી જ માહિતી શાંતિપૂર્વક સમજાવે છે.`,
    `સર્વિસ ખૂબ જ ઝડપી છે અને વાતાવરણ પણ એકદમ સ્વચ્છ છે.`,
    `તેમનો સપોર્ટ અને ગ્રાહકો સાથે વ્યવહાર કરવાની પદ્ધતિ ગમી.`,
    `પોતાના ક્ષેત્રમાં તેઓ ખૂબ જ અનુભવી અને કુશળ છે.`,
    `કામમાં કોઈ ખામી નહોતી, બધું એકદમ પરફેક્ટ રીતે પૂરું થયું.`
  ];

  const s4 = [
    `હું ચોક્કસપણે મારા સ્નેહીજનોને અહીં આવવા માટે સલાહ આપીશ.`,
    `આ જગ્યાએથી તમને ક્યારેય નિરાશા નહીં મળે, પૂરો સંતોષ મળશે.`,
    `વ્યાજબી ભાવ અને બેસ્ટ ક્વોલિટીનો અદ્ભુત સમન્વય છે અહીં.`,
    `ચોક્કસપણે આ વિસ્તારમાં સર્વશ્રેષ્ઠ સર્વિસ પ્રોવાઇડર છે.`,
    `મારા તરફથી તેમને પૂરા 5 સ્ટાર રેટિંગ આપવામાં આવે છે.`
  ];

  const detailed = `${getRand(s1)} ${getRand(s2)} ${getRand(s3)} ${getRand(s4)}`;

  // Story
  const story1 = [
    `મારી ઓફિસના એક મિત્રે મને ${businessName} વિશે વાત કરી હતી અને મેં મુલાકાત લીધી.`,
    `ઘણી શોધખોળ પછી મને ${tagStr} માટે ${businessName} નો ઓનલાઈન સંપર્ક મળ્યો.`,
    `હું પહેલીવાર જ્યારે ${businessName} ગયો ત્યારે મને સર્વિસ વિશે થોડી શંકા હતી.`,
    `મારે તાત્કાલિક ધોરણે ${tagStr} ની જરૂર હતી અને કોઈએ મને ${businessName} નું સજેસન આપ્યું.`,
    `ગઈકાલે જ હું કોઈ અગત્યની સર્વિસ માટે ${businessName} ની મુલાકાતે ગયો હતો.`
  ];

  const story2 = [
    `પણ ત્યાંના સ્ટાફે મારી બધી શંકા દૂર કરી અને ખૂબ જ ઝડપી રિસ્પોન્સ આપ્યો. તેમણે ${tagStr} નું કામ સમયસર પૂરું કર્યું.`,
    `તેમણે મારી બધી જરૂરિયાતો શાંતિથી સાંભળી અને પછી મને યોગ્ય બજેટમાં ${tagStr} નું શ્રેષ્ઠ કામ કરી આપ્યું.`,
    `ત્યાંની વ્યવસ્થિત સેવાથી હું ઘણો ખુશ થયો. ખાસ કરીને ${tagStr} ની ક્વોલિટી અદ્ભુત હતી.`,
    `આખી ટીમે ખૂબ જ સહકાર આપ્યો અને મારી ઈચ્છા મુજબ જ ${tagStr} નું કામ પૂરું કર્યું.`,
    `તેમના આવકારભાવ અને વિવેકપૂર્ણ રિસ્પોન્સે મારું દિલ જીતી લીધું. ખાસ કરીને ${tagStr} નું કામ શ્રેષ્ઠ રીતે હેન્ડલ કર્યું.`
  ];

  const story3 = [
    `હવે મને સમજાયું કે લોકો શા માટે આટલા વખાણ કરે છે. હું કાયમ માટે તેમનો ગ્રાહક બની ગયો છું.`,
    `ખરેખર આટલો સરસ અને સંતોષકારક અનુભવ મને ક્યાંય નથી મળ્યો. ખુબ ખુબ આભાર!`,
    `કામની ક્વોલિટી અને સ્ટાફનું ડેડિકેશન જોઈને ખૂબ જ આનંદ થયો. ચોક્કસ ફરી આવીશ.`,
    `જો તમારે શ્રેષ્ઠ ક્વોલિટી જોઈતી હોય તો આંખો બંધ કરીને અહીં જવું.`
  ];

  const story = `${getRand(story1)} ${getRand(story2)} ${getRand(story3)}`;

  return { short, detailed, story };
}
