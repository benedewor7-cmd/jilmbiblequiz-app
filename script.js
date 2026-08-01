const questions = [
{
    question: "What does HTML stand for?",
    answers: [
        {text:"Hyper Text Markup Language", correct:true},
        {text:"High Transfer Machine Language", correct:false},
        {text:"Hyperlinks Text Machine Language", correct:false},
        {text:"Home Tool Markup Language", correct:false}
    ]
},
{
    question: "Which language styles web pages?",
    answers: [
        {text:"HTML", correct:false},
        {text:"CSS", correct:true},
        {text:"Java", correct:false},
        {text:"Python", correct:false}
    ]
},
{
    question: "Which language makes websites interactive?",
    answers: [
        {text:"CSS", correct:false},
        {text:"JavaScript", correct:true},
        {text:"HTML", correct:false},
        {text:"PHP", correct:false}
    ]
}
];

const questionElement = document.getElementById("question");
const answerButtons = document.getElementById("answer-buttons");
const nextButton = document.getElementById("next-btn");

let currentQuestion = 0;
let score = 0;

function startQuiz(){
    currentQuestion = 0;
    score = 0;
    nextButton.innerHTML = "Next";
    showQuestion();
}

function showQuestion(){
    resetState();

    let current = questions[currentQuestion];
    questionElement.innerHTML = current.question;

    current.answers.forEach(answer=>{
        const button=document.createElement("button");
        button.innerHTML=answer.text;
        button.classList.add("btn");

        if(answer.correct){
            button.dataset.correct=answer.correct;
        }

        button.addEventListener("click",selectAnswer);
        answerButtons.appendChild(button);
    });
}

function resetState(){
    nextButton.style.display="none";

    while(answerButtons.firstChild){
        answerButtons.removeChild(answerButtons.firstChild);
    }
}

function selectAnswer(e){
    const selected=e.target;
    const correct=selected.dataset.correct==="true";

    if(correct){
        selected.classList.add("correct");
        score++;
    }else{
        selected.classList.add("wrong");
    }

    Array.from(answerButtons.children).forEach(button=>{
        if(button.dataset.correct==="true"){
            button.classList.add("correct");
        }
        button.disabled=true;
    });

    nextButton.style.display="block";
}

function showScore(){
    resetState();
    questionElement.innerHTML=`You scored ${score} out of ${questions.length}!`;
    nextButton.innerHTML="Play Again";
    nextButton.style.display="block";
}

function handleNextButton(){
    currentQuestion++;

    if(currentQuestion<questions.length){
        showQuestion();
    }else{
        showScore();
    }
}

nextButton.addEventListener("click",()=>{
    if(currentQuestion<questions.length){
        handleNextButton();
    }else{
        startQuiz();
    }
});

startQuiz();
