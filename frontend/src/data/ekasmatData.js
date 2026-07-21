export const ekasmatQuestions = [
  "Informasi yang disediakan oleh Bhumi Satya mudah dimengerti.",
  "Menu atau fitur dalam Bhumi Satya mudah digunakan.",
  "Bhumi Satya nyaman digunakan.",
  "Secara keseluruhan penggunaan Bhumi Satya memuaskan.",
  "Bhumi Satya sesuai dengan kebutuhan pengelolaan aset tanah.",
  "Bhumi Satya mudah dipelajari oleh pengguna.",
  "Bhumi Satya mudah dioperasikan.",
  "Pengguna dapat dengan mudah menghindari kesalahan saat menggunakan Bhumi Satya.",
  "Bhumi Satya bermanfaat bagi pengguna dalam pengelolaan aset tanah.",
  "Tampilan menu dalam Bhumi Satya mudah dikenali.",
  "Bhumi Satya memiliki fungsi dan kemampuan sesuai dengan yang diharapkan.",
];

export const ekasmatResponses = [
  {
    id: -1,
    timestamp: "2026/04/07 7:45:23 PM GMT+7",
    name: "Febri Ardiyanto",
    source: "Umum",
    scores: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  },
  {
    id: -2,
    timestamp: "2026/04/10 10:59:51 AM GMT+7",
    name: "Agus Andrijono",
    source: "BPKA",
    scores: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  },
  {
    id: -3,
    timestamp: "2026/04/10 11:00:11 AM GMT+7",
    name: "Dani M",
    source: "BPKA",
    scores: [5, 4, 5, 5, 5, 5, 5, 4, 5, 4, 5],
  },
  {
    id: -4,
    timestamp: "2026/04/10 11:00:45 AM GMT+7",
    name: "Mohammad Khisanul Masobih, S.Kom",
    source: "BPKA",
    scores: [4, 4, 5, 4, 4, 4, 4, 5, 5, 4, 5],
  },
  {
    id: -5,
    timestamp: "2026/04/10 11:00:53 AM GMT+7",
    name: "Sumarto",
    source: "BPKA",
    scores: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  },
  {
    id: -6,
    timestamp: "2026/04/10 11:01:10 AM GMT+7",
    name: "Yudy",
    source: "BPKA",
    scores: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  },
  {
    id: -7,
    timestamp: "2026/04/10 11:04:11 AM GMT+7",
    name: "Lutfi",
    source: "BPKA",
    scores: [5, 5, 5, 5, 5, 4, 4, 5, 5, 5, 4],
  },
  {
    id: -8,
    timestamp: "2026/04/10 11:05:19 AM GMT+7",
    name: "Sumarto",
    source: "BPKA",
    scores: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  },
  {
    id: -9,
    timestamp: "2026/04/10 11:05:42 AM GMT+7",
    name: "HARIYANTO",
    source: "BPKA",
    scores: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  },
  {
    id: -10,
    timestamp: "2026/04/10 11:07:58 AM GMT+7",
    name: "DWI ANDI OKTAVIANUS",
    source: "BPKA",
    scores: [5, 5, 5, 4, 4, 4, 5, 4, 5, 5, 4],
  },
];

export const scoreLabels = {
  1: "Sangat tidak setuju",
  2: "Tidak setuju",
  3: "Netral",
  4: "Setuju",
  5: "Sangat setuju",
};

export function getEkasmatSummary(responses = ekasmatResponses) {
  const totalResponses = responses.length;
  const totalQuestions = ekasmatQuestions.length;
  const allScores = responses.flatMap((response) => response.scores);
  const totalScore = allScores.reduce((sum, score) => sum + score, 0);
  const averageScore = allScores.length ? totalScore / allScores.length : 0;
  const maximumScore = totalResponses * totalQuestions * 5;
  const satisfactionIndex = maximumScore ? (totalScore / maximumScore) * 100 : 0;
  const scoreDistribution = [1, 2, 3, 4, 5].map((score) => ({
    score,
    label: String(score),
    count: allScores.filter((value) => value === score).length,
  }));

  const questionStats = ekasmatQuestions.map((question, index) => {
    const scores = responses.map((response) => response.scores[index]);
    const total = scores.reduce((sum, score) => sum + score, 0);
    const average = totalResponses ? total / totalResponses : 0;
    const positiveCount = scores.filter((score) => score >= 4).length;

    return {
      id: index + 1,
      question,
      average,
      total,
      positivePercentage: totalResponses
        ? (positiveCount / totalResponses) * 100
        : 0,
    };
  });

  return {
    totalResponses,
    totalQuestions,
    totalScore,
    maximumScore,
    averageScore,
    satisfactionIndex,
    scoreDistribution,
    questionStats,
  };
}
