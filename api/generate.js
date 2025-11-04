export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { draft } = req.body;

  if (!draft) {
    return res.status(400).json({ error: '초안이 필요합니다.' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `당신은 고마워톡 신청페이지 글쓰기 전문가입니다. 짧고 임팩트 있는 문장으로 작성해주세요.

초안:
${draft}

🚨 절대 규칙:
1. 한 섹션의 모든 문장을 반드시 한 줄에 작성
2. 절대 엔터(줄바꿈)를 치지 마세요
3. 문장과 문장 사이는 띄어쓰기 하나만
4. 🔥 리스트 항목만 각각 한 줄씩

🎨 색상 사용 규칙:
- [RED]: 타이틀에 딱 1곳만 사용
- [GREEN]: 전체 글에서 최대 2-3곳만 사용
- 섹션 구분이 필요하면 --- 사용

형식:
# 🎯 [RED]핵심메시지[/RED] 나머지 제목

## 📚 섹션1
문장1 문장2 문장3 문장4 문장5

---

## 🎯 섹션2
문장1 [GREEN]핵심 강조[/GREEN] 문장2 문장3

## 🔥 3가지 핵심
🔥 포인트1
🔥 포인트2
🔥 포인트3

## 💚 CTA
문장1 문장2 [GREEN]🎯 행동버튼[/GREEN]`
        }]
      })
    });

    const data = await response.json();

    if (data.content && data.content[0]) {
      return res.status(200).json({ result: data.content[0].text });
    } else {
      return res.status(500).json({ 
        error: '생성 실패', 
        details: data.error || data 
      });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
}