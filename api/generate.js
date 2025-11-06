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

  const { target, problem, solution, info, draft } = req.body;

  // 초안 수정 모드
  if (draft) {
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
            content: `당신은 고마워톡 신청페이지 전문 에디터입니다. 
사용자가 수정한 초안을 받아서, 고마워톡 신청페이지 형식으로 다듬어주세요.

📝 사용자가 수정한 초안:
${draft}

🎯 작업 지침:
1. 사용자가 수정한 내용을 최대한 존중
2. 사용자가 추가한 문장이나 내용은 그대로 유지
3. 사용자가 나눈 문단 구조 유지
4. 다만, 고마워톡 형식에 맞게 다듬기:
   - 타이틀에 [RED] 강조 1곳 (이미 있으면 유지)
   - 핵심 변화에 [GREEN] 강조 1-2곳 (이미 있으면 유지)
   - 적절한 곳에 이모지 추가 (이미 있으면 유지)
   - 섹션 사이 --- 구분선 추가

5. 절대 하지 말 것:
   - 사용자가 작성한 내용을 임의로 삭제하지 마세요
   - 사용자의 의도를 바꾸지 마세요
   - 기술 용어 추가하지 마세요

출력 형식:
# 타이틀

## 서브타이틀

---

## 📖 이렇게 달라집니다

내용

---

## 🔥 3가지 이유

🔥 이유1
🔥 이유2
🔥 이유3

---

## 💚 신청 방법

내용

🎯 [GREEN]지금 신청하기[/GREEN]`
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

  // 초기 작성 모드
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
          content: `당신은 고마워톡 신청페이지 전문 카피라이터입니다. 감동적이고 임팩트 있는 신청페이지를 작성하세요.

📌 입력 정보:
- 타깃 고객: ${target}
- 타깃 고객의 문제: ${problem}
- 제공하는 것: ${solution}
- 신청 정보: ${info}

🎯 작성 규칙:

**[섹션 1] 타이틀/서브타이틀**
# 메인 타이틀
- 8-12단어로 짧고 강렬하게
- [RED]로 핵심 변화 1곳만 강조
- 타깃 고객의 언어로 구체적 변화 약속

## 서브타이틀
- 2-3줄로 구체적 혜택 설명
- 감정적 공감 유도

---

**[섹션 2] 이렇게 달라집니다**
## 📖 이렇게 달라집니다

**Before (2-3줄):**
- 타깃 고객의 현재 고통을 생생하게
- 구체적인 상황 묘사

**After (2-3줄):**
- 변화된 모습을 구체적으로
- [GREEN]으로 핵심 변화 1곳 강조
- 희망과 설렘 전달

---

**[섹션 3] 3가지 이유**
## 🔥 3가지 이유

🔥 고객 혜택 중심 이유 1 (기술 용어 X, 고객 입장에서 좋은 점)
🔥 고객 혜택 중심 이유 2
🔥 고객 혜택 중심 이유 3

- 정확히 3개만 작성
- 각 이유는 한 줄로 간결하게
- "API", "시스템" 같은 기술 용어 절대 사용 금지
- "당신에게 이런 게 좋아요" 관점으로

---

**[섹션 4] 신청 방법**
## 💚 신청 방법

신청 정보를 긴박감 있게 전달:
- 날짜, 시간, 방법 명시
- 선착순/한정/특전 강조
- 2-3줄로 간결하게

🎯 [GREEN]지금 신청하기[/GREEN]

🚨 절대 규칙:
1. 각 섹션 끝에 반드시 --- 넣기
2. 타이틀은 8-12단어로 제한
3. "API", "시스템", "최적화" 같은 기술 용어 금지
4. Before/After 구조 명확히
5. [RED]는 타이틀에만 1곳
6. [GREEN]은 변화 스토리 1곳 + CTA 1곳 = 총 2곳만
7. 이유는 정확히 3개만

출력 예시:
# 🎯 [RED]자는 동안 수강생이 몰려드는[/RED] 카톡 마케팅

## 이제 더 이상 밤새 광고 올리지 마세요. 24시간 자동으로 상담 신청이 들어옵니다.

---

## 📖 이렇게 달라집니다

밤 11시, 또 수강생 모집 광고를 올립니다. 반응 없는 게시물을 보며 한숨만 나오죠.

하지만 고마워톡 하나로 [GREEN]자는 동안에도 신규 문의가 쌓이고[/GREEN], 아침에 일어나면 상담 예약이 가득합니다. 당신은 이제 콘텐츠 제작에만 집중하면 됩니다.

---

## 🔥 3가지 이유

🔥 자는 동안에도 자동으로 신규 상담 유입
🔥 한 달에 커피 2잔 값으로 24시간 마케터 고용
🔥 클릭 3번이면 시작, 기술 지식 제로

---

## 💚 신청 방법

11월 15일 (금) 저녁 8시 온라인 무료 세미나
선착순 50명 한정, 지금 신청하면 고마워톡 1개월 무료!

🎯 [GREEN]지금 신청하기[/GREEN]`
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