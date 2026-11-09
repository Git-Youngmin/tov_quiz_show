-- 로컬 개발용 예시 퀴즈 세트
INSERT INTO Quizzes (id, title) VALUES (1, '창세기 기초 퀴즈');

INSERT INTO Questions (quiz_id, position, question_text, choice1, choice2, choice3, choice4, correct_choice, time_limit_sec) VALUES
  (1, 1, '하나님이 빛을 만드신 날은 몇째 날일까요?', '첫째 날', '둘째 날', '셋째 날', '넷째 날', 1, 20),
  (1, 2, '노아가 방주에서 가장 먼저 내보낸 새는?', '비둘기', '까마귀', '참새', '독수리', 2, 20),
  (1, 3, '아브라함의 아들 이삭의 쌍둥이 아들은?', '가인과 아벨', '야곱과 에서', '요셉과 베냐민', '모세와 아론', 2, 15),
  (1, 4, '요셉이 팔려 간 나라는?', '바벨론', '앗수르', '애굽', '블레셋', 3, 15);
