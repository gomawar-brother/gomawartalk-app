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
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: `당신은 고마워톡 신청페이지 글쓰기 전문가입니다.

초안:
${draft}

🚨 필수 규칙:
1. 안내 문구 없이 바로 시작
2. 소제목 절대 금지 - 스토리텔링으로만
3. 각 문장은 한 줄씩, 하지만 빈 줄은 섹션 구분할 때만 (2-3곳)
4. 이모티콘으로 특징 표현 (🔥, 💚, ⚡ 등)
5. [RED]는 타이틀에만 1번
6. [GREEN]은 질문이나 대화체에만 2번
7. 광고 문구 금지 - 개인의 진솔한 이야기로

📋 정확한 형식 (줄간격 주의):
# 🏃‍♂️ [RED]사하라 250km를 완주한 평범한 직장인의 고백[/RED]
50도 사막, 7일간의 극한 레이스.
[GREEN]"도대체 왜 저런 걸 해?"[/GREEN] 라는 질문에 제 인생이 바뀌기 시작했습니다.
광고회사 마케터 → 도전 크리에이터 안정을 버린 순간, 진짜 '나'를 만났습니다.

🔥 한계는 내가 만든 착각이었다
🔥 비교 말고, 나만의 속도로
🔥 완벽보다 완주하는 용기

당신의 사하라는 무엇인가요?
찐사하라 프로젝트로 80명의 인원이 함께 해주셔서 홀트아동복지회를 통해 도움이 필요한 청소년에게 300만원의 기부금을 달성해서 전달했습니다.
그녀의 도전은 지금은 계속됩니다. 청춘남녀 달리기 소개팅은 또 뭔가요??`
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