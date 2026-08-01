const questions = [
{
    question: "Who built the ark?",
    answers: [
        {text:"Abraham", correct:false},
        {text:"Noah", correct:true},
        {text:"Moses", correct:false},
        {text:"David", correct:false}
    ]
},
{
    question: "How many disciples did Jesus choose?",
    answers: [
        {text:"10", correct:false},
        {text:"11", correct:false},
        {text:"12", correct:true},
        {text:"13", correct:false}
    ]
},
{
    question: "Who killed Goliath?",
    answers: [
        {text:"David", correct:true},
        {text:"Solomon", correct:false},
        {text:"Saul", correct:false},
        {text:"Samuel", correct:false}
    ]
},
{
    question: "Where was Jesus born?",
    answers: [
        {text:"Jerusalem", correct:false},
        {text:"Nazareth", correct:false},
        {text:"Bethlehem", correct:true},
        {text:"Egypt", correct:false}
    ]
},
{
    question: "What is the first book of the Bible?",
    answers: [
        {text:"Genesis", correct:true},
        {text:"Exodus", correct:false},
        {text:"Matthew", correct:false},
        {text:"Psalms", correct:false}
    ]
}
];

const questionElement = document.getElementById("question");
const answerButtons = document.getElementById("answer-buttons");
const nextButton = document.getElementById("next-btn");
const progress = document.getElementById("progress");
const progressFill = document.getElementById("progress-fill");
const timer = document.getElementById("timer");

let currentQuestionIndex = 0;
let score = 0;

let timeLeft = 90;
let countdown;

function startQuiz(){
    currentQuestionIndex = 0;
    score = 0;

    nextButton.innerHTML = "Next Question →";

    startTimer();

    showQuestion();
}

function startTimer(){

    clearInterval(countdown);

    timeLeft = 90;

    updateTimer();

    countdown = setInterval(() => {

        timeLeft--;

        updateTimer();

        if(timeLeft <= 0){

            clearInterval(countdown);

            showScore();

        }

    },1000);

}

function updateTimer(){

    let minutes = Math.floor(timeLeft / 60);

    let seconds = timeLeft % 60;

    timer.innerHTML =
        `${minutes.toString().padStart(2,"0")}:${seconds.toString().padStart(2,"0")}`;

}

function showQuestion(){

    resetState();

    let currentQuestion = questions[currentQuestionIndex];

    let questionNo = currentQuestionIndex + 1;

    progress.innerHTML =
        `Question ${questionNo} of ${questions.length}`;

    progressFill.style.width =
        `${(questionNo/questions.length)*100}%`;

    questionElement.innerHTML = currentQuestion.question;

    currentQuestion.answers.forEach(answer=>{

        const button = document.createElement("button");

        button.innerHTML = answer.text;

        button.classList.add("btn");

        if(answer.correct){

            button.dataset.correct = answer.correct;

        }

        button.addEventListener("click",selectAnswer);

        answerButtons.appendChild(button);

    });

}

function resetState(){

    nextButton.style.display="none";

    while(answerButtons.firstChild){

        answerButtons.removeChild(answerButtons.firstChild);
