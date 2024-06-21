// ==UserScript==
// @name         chatGPT helper
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://chat.openai.com/*
// @match        https://chatgpt.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js
// ==/UserScript==

(function () {
    'use strict';

    // Your code here...

    // global vars
    let SPLIT_WORDS = '在回答的末尾统计本回答的字数。';
    let conversationId = '';
    let location_href = '';
    let title = '';

    // function define
    let recordChatId = () => {

        let windowFetch = window.fetch
        window.fetch = (url, request) => {
            if (url.endsWith('/backend-api/conversation')) {
                const body_ = JSON.parse(request?.body);
                conversationId = body_['conversation_id'];
                console.log(conversationId);
            }
            return windowFetch(url, request);
        }
    }

    let randomNum = (minNum, maxNum) => {
        return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
    }
    let delayExecute = async (func, delayTime = randomNum(3000, 4000)) => {
        return await new Promise(resolve => {
            setTimeout(() => {
                resolve(func());
            }, delayTime);
        });
    };
    let checkStuck = async () => {
        setInterval(() => {
            let errorNodes = document.querySelectorAll('div[class*="text-red"]');
            if (errorNodes.length > 0) {
                if (conversationId?.length > 0) {
                    delayExecute(() => {
                        location.href = `https://chatgpt.com/c/${conversationId}`
                    })
                } else {
                    console.log('预料之外的异常，未获取到会话ID，请联系开发')
                }
            }
        }, 2000);
    };
    let waitResponse = async () => {
        while (1) {
            let tag = await delayExecute(() => {
                return document.querySelector('form > div > div.items-center > div > div > button > svg > path');
            });
            if (tag != null) {
                await delayExecute(() => {
                })
                break;
            } else {
                continue
            }
        }
    }
    let getAllQuestionsAndAnswersNodes = () => {
        return document.querySelectorAll('.flex.flex-grow.flex-col.max-w-full');
    }
    let getLastQuestion = () => {
        let nodes = document.querySelectorAll('.flex.flex-grow.flex-col.max-w-full');
        return nodes.length > 0 ? nodes[nodes.length - 1].innerText : '';
    }
    let getLastSecondaryQuestion = () => {
        let nodes = document.querySelectorAll('.flex.flex-grow.flex-col.max-w-full');
        return nodes.length > 1 ? nodes[nodes.length - 2].innerText : '';
    }
    let getLastAnswerOrQuestion = () => {
        const nodes = getAllQuestionsAndAnswersNodes();
        return nodes.length > 0 ? nodes[nodes.length -1] : undefined;
    }
    let reGenAnswer = async () => {
        return await delayExecute(() => {
            document.querySelector('.btn-neutral').click()
        })
    }
    let reGenAnswerWhenOccurError = async () => {
        return await delayExecute(() => {
            document.querySelector('.items-center .btn-primary').click()
        })
    }
    let continueGenAnswer = async () => {
        return await delayExecute(() => {
            document.querySelectorAll('.btn-neutral')[1].click()
        })
    }
    let isGPT4Block = () => {
        return document.querySelectorAll('.text-token-text-error')[0].innerText.search("You've reached the current usage cap for GPT-4. You can continue with the default model now") !== -1;
    }
    let parseTimeString = (timeString) => {
        // 创建一个表示当前日期的Date对象
        var currentDate = new Date();

        // 使用正则表达式或字符串分割方法将时间字符串分割成小时、分钟和AM/PM
        var timeParts = timeString.split(':');
        var hours = parseInt(timeParts[0]);
        var minutes = parseInt(timeParts[1].split(' ')[0]); // 去除 AM/PM 部分
        var amPm = timeParts[1].split(' ')[1]; // 获取AM/PM部分

        // 根据AM/PM部分调整小时
        if (amPm === "PM" && hours < 12) {
            hours += 12;
        } else if (amPm === "AM" && hours === 12) {
            hours = 0; // 处理12:xx AM的情况
        }

        // 将分割后的小时和分钟设置到Date对象
        currentDate.setHours(hours);
        currentDate.setMinutes(minutes);

        return currentDate;
    }
    let waitGPT4BlockEnd = async () => {
        let blockUntil = document.querySelectorAll('.text-token-text-error')[0].innerText.match(/.*?after (.*?)\..*/)[1];
        let blockUntilDate = parseTimeString(blockUntil);
        while (new Date() < blockUntilDate) {
            await delayExecute(() => {
            }, 30000)
        }
        delayExecute(() => {
            location.href = location_href
        })
    }
    let ask = async (content) => {
        await waitResponse();

        while (document.querySelectorAll('.text-token-text-error').length > 0) {
            if (isGPT4Block()) {
               await waitGPT4BlockEnd();
            }
            await reGenAnswerWhenOccurError();
            await waitResponse();
        }
        let lastAnswer = getLastAnswerOrQuestion()
        while (lastAnswer && lastAnswer.length > 0 && (lastAnswer.charAt(lastAnswer.length - 1) !== '.' || lastAnswer.charAt(lastAnswer.length - 1) !== '。')) {
            await reGenAnswer();
            await waitResponse();
            lastAnswer = getLastAnswerOrQuestion();
        }
        // while (document.querySelectorAll('.btn-neutral').length > 1) {
        //     await continueGenAnswer();
        //     await waitResponse();
        //     lastAnswer = getLastAnswerOrQuestion();
        // }
        await delayExecute(() => {
            document.querySelector('textarea').value = content;
            document.querySelector('textarea').dispatchEvent(new Event('input', { bubbles: true }));
        });
        while (document.querySelectorAll('.text-token-text-error').length > 0) {
            if (isGPT4Block()) {
               await waitGPT4BlockEnd();
            }
            await reGenAnswerWhenOccurError();
            await waitResponse();
        }
        await delayExecute(() => {
            document.querySelector('form > div > div.items-center > div > div > button').click();
        });
    };
    let printAll = async () => {
        let paragraphs = [];
        getAllQuestionsAndAnswersNodes().forEach(item => paragraphs.push(item.innerText));
        axios.post('https://123.207.27.133:5001/outlines/articles', {
            'paragraphs': paragraphs
        }).then(res => {
            console.log('文档已生成');
        })
        await delayExecute(() => {
            document.querySelectorAll('.break-words').forEach(item => console.log(item.innerText));
            localStorage.setItem('input_', '');
        });
    };
    let getStartQuestionIndex = (inputs) => {
        let last = getLastQuestion();
        let secondaryLast = getLastSecondaryQuestion();
        let lastIndex = inputs.indexOf(last);
        let secondaryLastIndex = inputs.indexOf(secondaryLast);
        if (lastIndex < 0 && secondaryLastIndex < 0) {
            return 0;
        } else if (secondaryLastIndex === inputs.length - 1) {
            return -1;
        } else {
            return lastIndex >= 0 ? lastIndex + 1 : secondaryLastIndex + 1;
        }
    }
    let scrollToBottomByInterval = () => {
        setInterval(() => {
            // let textAll = document.querySelectorAll('.text-sm');
            // document.querySelectorAll('div[class^="react-scroll-to-bottom"]')[1].scrollTo({
            //     top: textAll[textAll.length - 2].clientHeight,
            //     behavior: 'smooth'
            // });
            let items = document.querySelectorAll("button.cursor-pointer");
            if (items.length == 2) {
                items[items.length-1].click();
            }
        }, 20000);
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
    let createUploadButton = () => {
        let button = document.createElement('button');
        button.style.padding = '10px';
        button.style.background = 'white';
        button.style.color = 'black';
        button.style.borderRadius = '10px';
        button.id = 'upload-button';
        button.innerText = '上传文档';
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
        if (input_ == "") return "";
        beforeStart();
        // scrollToBottomByInterval();
        const input = input_.split(SPLIT_WORDS).filter(item => item.length > 10).map(item2 => item2.trim());

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
            await waitResponse();
            await printAll();
        }
        await printAll();
    }
    let beforeStart = () => {
        localStorage.setItem('start', 'true');
        disableButton();
        // if (document.querySelector('form textarea') == null) {
        //     document.querySelector('form button').click();
        // }
    }
    let afterStop = () => {
        localStorage.setItem('start', 'false');
        endButton();
    }
    let startMain = async () => {
        location_href = location.href;
        console.log('location_href is: ' + location_href)

        checkStuck();

        const input_ = document.querySelector('#input_').value;
        localStorage.setItem('input_', input_);
        await startChat(input_); //promise

        while (1) {
            let res = await axios.get('https://123.207.27.133:5001/outlines/ready')
            if (!res.data.outline) {
                alert('工作完毕')
                break
            } else {
                const newInput = res.data.outline.content;
                document.querySelector('#input_').value = newInput;
                localStorage.setItem('input_', newInput);
                console.log(newInput);
                delayExecute(() => {
                        location.href = `https://chat.openai.com/chat`
                })
                await startChat(newInput); //promise
            }
        }
        afterStop();
    };
    let stopMain = () => {
        afterStop();
        alert('上一轮的提问不会被终止，提前结束请刷新页面');
    }

    // main function
    recordChatId();
    setTimeout(() => {

        let ele = document.querySelector('.text-2xl');
        if (ele) {
            ele.remove();
        }

        let div = document.createElement('div');
        div.innerHTML = '<textarea id="input_" rows="10" cols="30" style="background: white; color: black"></textarea><br>'
        let startButton = createStartButton();
        startButton.onclick = startMain;
        div.appendChild(startButton);
        let stopButton = createStopButton();
        stopButton.onclick = stopMain;
        div.appendChild(stopButton);
        let uploadButton = createUploadButton();
        uploadButton.onclick = printAll;
        div.appendChild(uploadButton);
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
    }, 5000);


})();
