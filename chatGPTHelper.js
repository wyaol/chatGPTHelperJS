// ==UserScript==
// @name         chatGPT helper
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://chat.openai.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js
// ==/UserScript==

(function () {
    'use strict';

    // Your code here...

    // global vars
    let SPLIT_WORDS = '在回答的末尾统计本回答的字数。';

    // function define
    let randomNum = (minNum, maxNum) => {
        return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
    }
    let delayExecute = async (func) => {
        return await new Promise(resolve => {
            setTimeout(() => {
                resolve(func());
            }, randomNum(3000, 4000));
        });
    };
    let checkStuck = async () => {
        setInterval(() => {
            if (document.querySelectorAll('div[class*="border-red"]').length > 0) {
                location.reload();
            }
        }, 2000);
    };
    let waitResponse = async () => {
        while (1) {
            let tag = await delayExecute(() => {
                return document.querySelector('.text-2xl');
            });
            if (tag === null) {
                await delayExecute(() => {
                })
                break;
            } else {
                continue
            }
        }
    }
    let getLastQuestion = () => {
        let nodes = document.querySelectorAll('.text-base .items-start');
        return nodes.length > 0 ? nodes[nodes.length - 2].innerText : '';
    }
    let ask = async (content) => {
        await waitResponse();
        await delayExecute(() => {
            document.querySelector('textarea').value = content;
        });
        await delayExecute(() => {
            document.querySelector('form > div > div:nth-child(2) > button').click();
        });
    };
    let printAll = async () => {
        await delayExecute(() => {
            document.querySelectorAll('.break-words').forEach(item => console.log(item.innerText));
        });
    };
    let getStartQuestionIndex = (inputs) => {
        let last = getLastQuestion();
        let lastIndex = inputs.indexOf(last);
        if (lastIndex < 0) {
            return 0;
        } else if (lastIndex === inputs.length - 1) {
            return -1;
        } else {
            return lastIndex + 1;
        }
    }
    let scrollToBottomByInterval = () => {
        setInterval(() => {
            document.querySelectorAll('div[class^="react-scroll-to-bottom"]')[1].scrollTo({
                top: document.querySelector('.text-sm').clientHeight,
                behavior: 'smooth'
            });
        }, 2000);
    }
    let createStartButton = () => {
        let button = document.createElement('button');
        button.style.padding = '10px';
        button.style.background = 'black';
        button.style.color = 'white';
        button.style.borderRadius = '10px';
        button.id = 'start-button';
        button.innerText = '开始提问';
        return button;
    }
    let createStopButton = () => {
        let button = document.createElement('button');
        button.style.padding = '10px';
        button.style.background = 'red';
        button.style.color = 'black';
        button.style.borderRadius = '10px';
        button.id = 'stop-button';
        button.innerText = '停止提问';
        return button;
    }
    let disableButton = () => {
        let button_ = document.querySelector('#start-button');
        button_.disabled = true
        button_.style.background = 'grey'
        button_.innerHTML = '正在执行中...'

    }
    let endButton = () => {
        let button_ = document.querySelector('#start-button');
        button_.innerHTML = '已结束，重新开始请刷新页面';
    }
    let startChat = async (input_) => {
        beforeStart();
        scrollToBottomByInterval();
        const input = input_.split(SPLIT_WORDS).filter(item => item.length > 10).map(item2 => item2.trim())
        console.log(input)
        let startQuestionIndex = getStartQuestionIndex(input);
        if (startQuestionIndex !== -1) {
            for (let i = startQuestionIndex; i < input.length; i++) {
                if (localStorage.getItem('start') === 'true') {
                    await ask(input[i]);
                } else {
                    afterStop();
                    break;
                }
            }
            await printAll();
        }
        afterStop();
    }
    let beforeStart = () => {
        localStorage.setItem('start', 'true');
        disableButton();
        if (document.querySelector('form textarea') == null) {
            document.querySelector('form button').click();
        }
    }
    let afterStop = () => {
        localStorage.setItem('start', 'false');
        endButton();
    }
    let startMain = () => {
        checkStuck();
        const input_ = document.querySelector('#input_').value;
        localStorage.setItem('input_', input_);
        console.log(input_);
        startChat(input_); //promise
    };
    let stopMain = () => {
        afterStop();
        alert('上一轮的提问不会被终止，提前结束请刷新页面');
    }

    // main function
    setTimeout(() => {
        let div = document.createElement('div');
        div.innerHTML = '<textarea id="input_" rows="10" cols="30" style="background: white; color: black"></textarea><br>'
        let startButton = createStartButton();
        startButton.onclick = startMain;
        div.appendChild(startButton);
        let stopButton = createStopButton();
        stopButton.onclick = stopMain;
        div.appendChild(stopButton);
        let style = {
            position: 'absolute',
            top: 0,
            right: 0
        };
        Object.keys(style).forEach(key => {
            div.style[key] = style[key];
        });
        document.body.appendChild(div);
        document.querySelector('#input_').value = localStorage.getItem('input_');

        if (localStorage.getItem('start') === 'true') {
            startMain();
        }
    }, 4000);


})();
