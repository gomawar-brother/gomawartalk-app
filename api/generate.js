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

  const { target, problem, solution, info } = req.body;

  if (!target || !problem || !solution || !info) {
    return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
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
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `당신은 고마워톡 신청페이지 전문 카피라이터입니다. 아래 정보로 감동적이고 임팩트 있는 신청페이지를 작성하세요.

📌 입력 정보:
- 타깃 고객: ${target}
- 타깃 고객의 문제: ${problem}
- 제공하는 것: ${solution}
- 신청 정보: ${info}

🎯 작성 규칙:

**1. 타이틀/서브타이틀**
- 타깃 고객의 언어로 구체적인 변화를 약속
- 타이틀: [RED]핵심 변화[/RED] 포함, 짧고 강렬하게
- 서브타이틀: 2-3줄로 구체적 혜택 설명
- 모든 문장을 한 줄에 작성 (절대 엔터 금지)

**2. 타깃 고객의 변화 스토리**
- "Before → After" 스토리텔링
- 감정적 공감 유도
- 3-4문장, 모두 한 줄에 작성
- [GREEN]으로 핵심 변화 1-2곳 강조

**3. 변화 가능 이유**
- 🔥 이모지로 시작하는 리스트
- 각 항목은 한 줄씩
- 3-5개 항목
- 객관적이고 구체적으로

**4. CTA**
- 신청 정보를 행동 유도로 연결
- [GREEN]으로 행동 버튼 강조
- 긴박감과 가치 강조
- 모든 문장을 한 줄에 작성

🚨 절대 규칙:
- 섹션 제목(##)과 일반 문장은 절대 엔터 치지 않고 한 줄에
- 리스트 항목(🔥)만 각각 한 줄씩
- 섹션 사이는 --- 로 구분
- [RED]는 타이틀에만 1곳
- [GREEN]은 전체에서 2-3곳만
- 고마워톡에 붙여넣었을 때 줄간격이 자연스럽게

출력 형식:
# 🎯 [RED]핵심변화[/RED] 나머지 타이틀

## 부제목 문장1 문장2 문장3

---

## 📖 당신의 변화 스토리
문장1 문장2 [GREEN]핵심변화[/GREEN] 문장3 문장4

---

## 🔥 변화가 가능한 이유
🔥 이유1
🔥 이유2
🔥 이유3

---

## 💚 지금 신청하세요
문장1 문장2 [GREEN]🎯 신청하기[/GREEN]`
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