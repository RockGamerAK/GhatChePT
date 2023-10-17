// var Base = 'https://ghatchept.rockgamerak.repl.co'
let openaiApiKey = prompt('KEY PLEASE')
var systemPrompt = 'DO NOT INCLUDE THE QUESTIONS'
var replacements = [
    {
        name: 'hi', 
        text: 'Hi there! How can I help you?', 
    }, 
    {
        name: 'who are you', 
        text: 'I am GhatChePT, a natural language processing (NLP) chatbot designed to generate human-like conversations. I am capable of responding to a variety of topics.'
    }, 
    {
        name: 'open', 
        function: openFunction,
    }, 
]

function openFunction(url) {
    url = url.split(' ')
    let hasUrls = false
    url.forEach(function(u, i) {
        if (!u.includes('://')) url = `https://${u}`
        if (u.split('://')[1].includes('.')) hasUrls = true
        let newA = document.createElement('a')
        newA.href = url
        newA.target = '_blank'
        document.body.appendChild(newA)
        newA.click()
        newA.remove()
    })
    return [hasUrls, url]
}

var prevPrompt = ''
var sUserId = String(Math.floor(Math.random()*1000));
var mI = 0

var bTextToSpeechSupported = false;
var bSpeechInProgress = false;
var oSpeechRecognizer = null
var oSpeechSynthesisUtterance = null;
var oVoices = null;

if ('webkitSpeechRecognition' in window) {
} 
else {
    //speech to text not supported
    lblSpeak.style.display = 'none';
}

if ('speechSynthesis' in window) {
    bTextToSpeechSupported = true;
    speechSynthesis.onvoiceschanged = function () {
        oVoices = window.speechSynthesis.getVoices();
        oVoices.forEach(function(v, i) {
            selVoices[selVoices.length] = new Option(v.name, i);
        })
    };
}

var modelsReq = new XMLHttpRequest()
modelsReq.open('GET', 'https://api.openai.com/v1/models')
modelsReq.setRequestHeader('Authorization', `Bearer ${openaiApiKey}`)
modelsReq.addEventListener('load', function() {
    let models = []
    let works = false
    if (!!this) {
        if (!!this.responseText) {
            if (!!JSON.parse(this.responseText)) {
                if (!!JSON.parse(this.response).data) {
                    works = true
                }
            }
        }
    }
    if (!works) {
        console.log(this.response)
    }
    if (works) {
        let modelsObj = JSON.parse(this.responseText).data
        modelsObj.forEach(function(m, i) {
            models.push(m['id'])
        })
    }
    if (models.length > 0) {
        selModel.querySelectorAll('option').forEach(function(o, i) {
            o.remove()
        })
        let hasModel = false
        let theModel = ''
        if (String(models).includes('gpt-3.5-turbo-16k')) {
            hasModel = true
            theModel = 'gpt-3.5-turbo-16k'
        }
        else if (String(models).includes('gpt-3.5-turbo')) {
            hasModel = true
            theModel = 'gpt-3.5-turbo'
        }
        models.forEach(function(m, i) {
            let modelOpt = document.createElement('option')
            modelOpt.value = m
            let modelText = document.createTextNode(m)
            modelOpt.appendChild(modelText)
            if (hasModel && m === theModel) {
                modelOpt.setAttribute('selected', '')
            }
            selModel.appendChild(modelOpt)
        })
    }
});
modelsReq.send()

function Send() {
    var sQuestion = txtMsg.value;
    if (sQuestion == '') {
        alert('Type in your question!');
        txtMsg.focus();
        return;
    }
    addElement('user', sQuestion)
    var isThere = false
    var rIndex = ''
    var content
    replacements.forEach(function(r, i) {
        let rName = r['name']
        if (sQuestion.toLowerCase().startsWith(rName)) {
            isThere = true
            rIndex = i
        }
    })
    if (isThere) {
        if (!!replacements[rIndex]['function']) {
            let params = sQuestion.split(`${replacements[rIndex]['name']} `)[1]
            if (params[0]) {
                content = `Opened ${replacements[rIndex]['function'](params)[1]}.`
            }
        }
        else {
            content = replacements[rIndex]['text']
            addElement('ai', content)
            TextToSpeech(content);
            return
        }
    }
    if (sQuestion.toLowerCase().startsWith('try again')) {
        sQuestion = prevPrompt
    }

    var httpReq = new XMLHttpRequest();
    httpReq.open('POST','https://api.openai.com/v1/completions');
    httpReq.setRequestHeader('Accept', 'application/json');
    httpReq.setRequestHeader('Content-Type', 'application/json');
    httpReq.setRequestHeader('Authorization', `Bearer ${openaiApiKey}`)
    httpReq.addEventListener('load', function () {
        var oJson = {}
        var s = '';
        let isError = false
        try {
            oJson = JSON.parse(this.responseText);
        } 
        catch (ex) {
            s += `Error: ${ex.error.message}`
            isError = true
        }
        if (oJson.choices && oJson.choices[0].text) {
            s += oJson.choices[0].text;
            if (selLang.value != 'en-US') {
                var a = s.split('?\n');
                if (a.length == 2) {
                    s = a[1];
                }
            }
            if (s == '') s = 'No response';
            addElement('ai', s)
            TextToSpeech(s);
            
            txtMsg.value = '';
            if (!sQuestion.toLowerCase().startsWith('try again')) {
                prevPrompt = sQuestion
            }
                }
    });
    httpReq.addEventListener('error', function() {
        addElement('error', this)
    })

    var sPrompt = `${systemPrompt}: ${sQuestion}`
    var sModel = selModel.value;// "text-davinci-003";
    var iMaxTokens = 2048;
    var dTemperature = 0.5; 
    var data = {
    model: sModel,
    prompt: sPrompt,
    max_tokens: iMaxTokens,
    user: sUserId,
    temperature: dTemperature,
    frequency_penalty: 0.0, //Number between -2.0 and 2.0  
                            //Positive values decrease the model's likelihood 
                            //to repeat the same line verbatim.
    presence_penalty: 0.0,  //Number between -2.0 and 2.0. 
                            //Positive values increase the model's likelihood 
                            //to talk about new topics.
    stop: ['#', ';']        //Up to 4 sequences where the API will stop 
                            //generating further tokens. The returned text 
                            //will not contain the stop sequence.
    }

    httpReq.send(JSON.stringify(data));
    txtMsg.value = '';
    if (!sQuestion.toLowerCase().startsWith('try again')) {
        prevPrompt = sQuestion
    }
}

function addElement(name, content) {
    let messageEle = document.createElement('div')
    messageEle.classList.add(name)
    messageEle.classList.add('message')
    if (name === 'error') {
        let errorText = document.createElement('span')
        errorText.classList.add('text')

        let errorTextSpan = document.createElement('span')
        errorTextSpan.classList.add('text__span')
        let response = {}
        try {
            oJson = JSON.parse(this.responseText);
        } 
        catch (ex) {
            response = `Error: ${ex.error.message}`
        }
        errorTextSpan.textContent = response

        errorText.appendChild(errorTextSpan)
        errorMessageEle.appendChild(errorText)

        messages.appendChild(errorMessageEle)
    }
    else if (name === 'ai') {
        let aiImage = document.createElement('div')
        aiImage.classList.add('image')
        messageEle.appendChild(aiImage)
    
        let aiText = document.createElement('span')
        aiText.classList.add('text')
        let aiTextSpan = document.createElement('span')
        aiTextSpan.classList.add('text__span')
        aiText.appendChild(aiTextSpan)
        messageEle.appendChild(aiText)
        messages.appendChild(messageEle)

        var cTSpanHTML = ''
        var sI = 0
        var interval = setInterval(doActs, 50)
        doActs()
        function doActs() {
            if (sI < content.length) {
                let currLett = content.split('')[sI]
                cTSpanHTML = `${cTSpanHTML}${currLett}`
                if (currLett === ',') {
                    // setTimeout(function() {
                        aiTextSpan.innerHTML = cTSpanHTML
                    // }, 30)
                }
                else if (currLett === '.' || currLett === '?' || currLett === '!') {
                    // setTimeout(function() {
                        aiTextSpan.innerHTML = cTSpanHTML
                    // }, 45)
                }
                else {
                    aiTextSpan.innerHTML = cTSpanHTML
                }
                sI++
            }
            else {
                clearInterval(interval)
            }
        }
    }
    else {
        messageEle.innerHTML = `
        <div class="image"></div>
        <div class="text">
            <span>${content}</span>
        </div>`
        messages.appendChild(messageEle)
    }
}

function ChangeLang(o) {
    if (oSpeechRecognizer) {
        oSpeechRecognizer.lang = selLang.value;
        //SpeechToText()
    }
}


function TextToSpeech(s) {
    if (bTextToSpeechSupported == false) return;
    if (chkMute.checked) return;

    oSpeechSynthesisUtterance = new SpeechSynthesisUtterance();

    if (oVoices) {
        var sVoice = selVoices.value;
        if (sVoice != '') {
            oSpeechSynthesisUtterance.voice = oVoices[parseInt(sVoice)];
        } 
    } 

    oSpeechSynthesisUtterance.onend = function () {
        //finished talking - can now listen
        if (oSpeechRecognizer && chkSpeak.checked) {
            oSpeechRecognizer.start();
        }
    }

    if (oSpeechRecognizer && chkSpeak.checked) {
        //do not listen to yourself when talking
        oSpeechRecognizer.stop();
    }

    oSpeechSynthesisUtterance.lang = selLang.value;
    oSpeechSynthesisUtterance.text = s;
    //Uncaught (in promise) Error: A listener indicated an 
    //asynchronous response by returning true, but the message channel closed 
    window.speechSynthesis.speak(oSpeechSynthesisUtterance);
}

function Mute(b) {
    if (b.checked) {
        selVoices.style.display = 'none';
    } 
    else {
        selVoices.style.display = '';
    }
}

function SpeechToText() {
    if (oSpeechRecognizer) {
        if (chkSpeak.checked) {
            oSpeechRecognizer.start();
        } 
        else {
            oSpeechRecognizer.stop();
        }
        return;
    } 

    oSpeechRecognizer = new webkitSpeechRecognition();
    oSpeechRecognizer.continuous = true;
    oSpeechRecognizer.interimResults = true;
    oSpeechRecognizer.lang = selLang.value;
    oSpeechRecognizer.start();

    oSpeechRecognizer.onresult = function (event) {
        var interimTranscripts = '';
        for (var i = event.resultIndex; i < event.results.length; i++) {
            var transcript = event.results[i][0].transcript;

            if (event.results[i].isFinal) {
                txtMsg.value = transcript;
                Send();
            } 
            else {
                transcript.replace('\n', '<br>');
                interimTranscripts += transcript;
            }

            var oDiv = document.getElementById('idText');
            oDiv.innerHTML = `<span style="color: #999;">${interimTranscripts}</span>`;
        }
    };

    oSpeechRecognizer.onerror = function (event) {
    };
}