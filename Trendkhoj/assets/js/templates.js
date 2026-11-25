/**
 * TrendKhoj India - Local Template Engine
 * 
 * Generates editorial article outlines, headlines, and social media copy
 * entirely using local templates without requiring external paid AI APIs.
 * 
 * Strictly adheres to editorial integrity: outlines are scaffold frameworks
 * for human writers and journalists to fill with verified facts.
 */

(function (window) {
  'use strict';

  // Category-specific hashtag mapping
  const CATEGORY_HASHTAGS = {
    Cricket: ['#CricketIndia', '#BCCI', '#TeamIndia', '#IndianCricket', '#MatchUpdates'],
    Education: ['#EducationIndia', '#ExamUpdate', '#Aspirants', '#StudentAlert', '#BoardExams'],
    Jobs: ['#GovtJobs', '#SarkariNaukri', '#JobAlert', '#Recruitment2026', '#CareerUpdate'],
    Technology: ['#TechIndia', '#DigitalIndia', '#Innovation', '#TechNews', '#IndianTech'],
    Automobile: ['#AutoNewsIndia', '#ElectricVehicles', '#CarReview', '#IndianAuto', '#NewLaunch'],
    Entertainment: ['#IndianCinema', '#EntertainmentNews', '#BoxOffice', '#MovieBuzz', '#Bollywood'],
    Government: ['#GovtScheme', '#PublicPolicy', '#IndiaUpdates', '#CitizenAlert', '#NationalNews'],
    Default: ['#TrendKhoj', '#IndiaTrends', '#TrendingNow', '#CurrentAffairs']
  };

  function getHashtags(category, title) {
    const list = CATEGORY_HASHTAGS[category] || CATEGORY_HASHTAGS.Default;
    const cleanWord = title.replace(/[^a-zA-Z0-9]/g, '');
    const topicTag = cleanWord.length > 3 ? `#${cleanWord.slice(0, 16)}` : '#IndiaNews';
    return [...list.slice(0, 3), topicTag, '#TrendKhojIndia'].join(' ');
  }

  const Templates = {
    /**
     * Generates an editable article outline in English, Hindi, or Hinglish.
     */
    generateOutline(topic, lang = 'en') {
      const title = topic.title || 'Selected Topic';
      const cat = topic.category || 'General';
      const src = topic.sourceName || 'Primary verified source';
      const summary = topic.summary || 'Topic currently gaining traction across Indian web searches.';

      if (lang === 'hi') {
        return `=====================================================
संपादकीय रूपरेखा (Article Outline) - TrendKhoj India
विषय: ${title}
श्रेणी: ${cat}
आधिकारिक स्रोत / संदर्भ: ${src}
=====================================================

1. संभावित मुख्य शीर्षक (Headlines):
   • ${title}: जानिए आज क्यों चर्चा में है यह विषय और क्या हैं मुख्य अपडेट
   • क्या है ${title} का पूरा मामला? 5 प्रमुख बिंदुओं में आसान विश्लेषण

2. प्रस्तावना व संदर्भ (Hook & Context):
   • इंटरनेट व सर्च प्लेटफॉर्म्स पर ${title} को लेकर व्यापक जिज्ञासा क्यों देखी जा रही है?
   • संदर्भ: ${summary}
   • क्या यह कोई आधिकारिक घोषणा, परीक्षा नोटिस, खेल घटनाक्रम या नीतिगत बदलाव से जुड़ा है?

3. मुख्य तथ्य व बिंदुवार विवरण (Key Facts):
   • [आधिकारिक स्रोत ${src} द्वारा जारी की गई मूल जानकारी यहां दर्ज करें]
   • मुख्य तिथियां, पात्रता, आंकड़े या प्रक्रिया (यदि लागू हो)
   • संबंधित अधिकारियों या प्रवक्ताओं का बयान

4. आम नागरिकों / पाठकों पर प्रभाव (Impact & Significance):
   • इस घटनाक्रम का विद्यार्थियों, उपभोक्ताओं या संबंधित वर्ग पर क्या प्रत्यक्ष असर पड़ेगा?
   • अगला कदम या आवेदन/उपयोग की प्रक्रिया

5. सोशल मीडिया विमर्श व जनप्रतिक्रिया (Public Discourse):
   • इंटरनेट पर आम लोगों द्वारा पूछे जा रहे मुख्य सवाल
   • क्या कोई भ्रामक दावा या अफवाह फैल रही है? (तथ्य जांच आवश्यक)

6. संपादकीय निष्कर्ष व सलाह (Conclusion):
   • पाठकों के लिए आधिकारिक पोर्टल का लिंक और महत्वपूर्ण सावधानियां।
   • स्रोत: हमेशा आधिकारिक पोर्टल (${topic.sourceUrl || src}) से ही पुष्टि करें।`;
      }

      if (lang === 'hinglish') {
        return `=====================================================
Digital Content Outline (Hinglish) - TrendKhoj India
Topic: ${title}
Category: ${cat} | Source: ${src}
=====================================================

1. Catchy Title Ideas:
   • ${title} Kyon Ho Raha Hai Trend? Janiye Sabhi Zaruri Details
   • ${title}: Ye 5 Batein Har Kisi Ko Pata Honi Chahiye!

2. Hook & Why It Matters (Prastavana):
   • India me internet users ${title} search kyon kar rahe hain?
   • Context: ${summary}
   • Aaj ka sabse bada update kya hai?

3. Important Verified Facts (Mukhya Jankari):
   • [Source: ${src} ke dwara confirm ki gayi details yahan add karein]
   • Date, eligibility, result ya launch details
   • Official spokesperson / authorities ka statement

4. Readers Ke Liye Fayda / Impact:
   • Students, viewers ya common citizens par iska kya asar hoga?
   • Direct link ya action step kya hai?

5. Fact-Check Alert:
   • Fake news ya viral rumor se bachein.
   • Official link se verify zaroor karein (${topic.sourceUrl || src}).`;
      }

      // Default: English
      return `=====================================================
Editorial Article Outline - TrendKhoj India
Topic: ${title}
Category: ${cat}
Primary Source / Reference: ${src}
=====================================================

1. Working Headline Options:
   • ${title}: What Sparked Today's Search Spike and What It Means
   • Explained: The Key Developments Driving Interest Around ${title}
   • Quick Guide: Everything You Need to Know About ${title}

2. The Lede & Background Context (Why it's in focus):
   • Search surge driver: Why are Indian netizens actively seeking information on this today?
   • Context summary: ${summary}
   • Relevant institutional background or recent trigger event.

3. Verified Factual Developments:
   • Verified info from primary source (${src}): [Insert official details here]
   • Crucial timestamps, numbers, scores, policy guidelines, or release dates.
   • Official statements or official gazette/portal notifications.

4. Public Impact & Stakeholder Implications:
   • Who does this affect directly? (e.g., job aspirants, consumers, sports followers, taxpayers)
   • Immediate next steps or actionable guidance for readers.

5. Countering Misinformation (Fact-Check Safeguard):
   • Cross-check viral claims against verified circulars.
   • Official Reference URL: ${topic.sourceUrl || src}

6. Conclusion & Reader Resource Box:
   • Direct readers to official documentation rather than unverified WhatsApp forwards.`;
    },

    /**
     * Generates a suite of headline options for different publishing formats.
     */
    generateHeadlines(topic) {
      const title = topic.title || 'Trending Topic';
      const cat = topic.category || 'National';

      return [
        {
          type: 'Breaking / Real-Time Update',
          badge: 'News Flash',
          text: `🔴 UPDATE: ${title} triggers nationwide search curiosity — Here is what is confirmed so far.`
        },
        {
          type: 'Curiosity & Explainer Hook',
          badge: 'Explainer',
          text: `Why everyone in India is searching for "${title}" today: A breakdown of facts, dates, and official updates.`
        },
        {
          type: 'Actionable Reader Guide',
          badge: 'Direct Guide',
          text: `${title} Explained: Official sources, timeline, and what you need to know.`
        },
        {
          type: 'Hindi Editorial Headline (हिंदी)',
          badge: 'Hindi News',
          text: `📢 ${title}: जानिए आज क्यों सर्च हो रहा है यह विषय, क्या हैं ताजा आधिकारिक अपडेट्स`
        }
      ];
    },

    /**
     * Generates ready-to-copy social media captions for Twitter/X, WhatsApp, LinkedIn, Instagram.
     */
    generateSocialCaptions(topic) {
      const title = topic.title || 'Trending Topic';
      const cat = topic.category || 'General';
      const src = topic.sourceName || 'Verified Portal';
      const tags = getHashtags(cat, title);
      const url = topic.sourceUrl || 'https://trendkhoj-india.netlify.app';

      return [
        {
          platform: 'Twitter / X Thread Opener',
          icon: '𝕏',
          characterCountAdvice: 'Compact & Punchy',
          content: `1/3 🧵 Why is "${title}" trending across India today?\n\nHere is a quick factual breakdown based on reports from ${src}.\n\n👇 Read the key highlights below:\n${tags}`
        },
        {
          platform: 'WhatsApp Bulletin / Channel Post',
          icon: '💬',
          characterCountAdvice: 'Formatted for Messaging',
          content: `*🇮🇳 TrendKhoj India Bulletin*\n\n📌 *Topic:* ${title}\n📂 *Category:* ${cat}\n🏛 *Source:* ${src}\n\n🔍 *Summary:* ${topic.summary || 'High search volume reported across India.'}\n\n⚠️ *Editorial Advisory:* Always verify unconfirmed forwards through official links:\n🔗 ${url}\n\n_Discovered via TrendKhoj India_`
        },
        {
          platform: 'LinkedIn Professional Post',
          icon: '💼',
          characterCountAdvice: 'Analytical & Structured',
          content: `Public search interest in India is currently centering on "${title}" within the ${cat} sector.\n\nKey takeaways from an industry perspective:\n• Interest reflects active citizen/consumer engagement around recent institutional developments.\n• Source reference: ${src}.\n\nHow do you see this impacting the sector over the coming months?\n\n#TrendKhoj #IndiaTrends #PolicyInsights #IndustryUpdate`
        },
        {
          platform: 'Instagram / Threads Caption',
          icon: '📸',
          characterCountAdvice: 'Engaging & Visual',
          content: `Aaj India mein kya trending hai? 🇮🇳\n\nSearch radar spotlight: "${title}" is seeing high query volume today.\n\nSwipe through for context & official source references from ${src} ➡️\n\nSave this post for reference & share with your friends who were searching for this today!\n\n.\n.\n${tags}`
        }
      ];
    }
  };

  window.TrendKhojTemplates = Templates;
})(window);
