// Add CKeditor 4 dialog plugin with one input field "cowriter" which add text from openai api.
CKEDITOR.dialog.add('cowriterDialog', function (editor) {

    // Settings
    let select_model = 'gpt-4',
        select_temperature = 0.5,
        select_max_tokens = 4000,
        select_amount = 1;

    const escapeHtml = (unsafe) => {
        return unsafe.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
    }

    return {
        title: 'Cowriter',
        minWidth: 400,
        minHeight: 70,
        contents: [
            {
                id: 'tab-basic',
                label: editor.lang.cowriter.tabGeneral,
                accessKey: 'C',
                elements: [
                    {
                        type: 'textarea',
                        id: 'cowriter',
                        label: editor.lang.cowriter.writeAbout,
                        rows: 6,
                        validate: CKEDITOR.dialog.validate.notEmpty(editor.lang.cowriter.errorNotEmpty),
                        setup: function (element) {
                            this.setValue(element.getText())
                        },
                        commit: function (element) {
                            // Show loading animation
                            element.setText(' Loading … ')

                            // Use XMLHttpRequest to get the text from openai api.
                            var xhr = new XMLHttpRequest()
                            xhr.open('POST', 'https://api.openai.com/v1/chat/completions', true)
                            xhr.setRequestHeader('Content-Type', 'application/json')


                            // Set the authorization header with your API key.
                            xhr.setRequestHeader('Authorization', 'Bearer ' + OPENAI_KEY)
                            xhr.setRequestHeader('OpenAI-Organization', OPENAI_ORG)

                            // Send the request and set status to element in editor.
                            xhr.send(JSON.stringify({
                                messages: [{role: "user", content: this.getValue()}], // Text to complete
                                max_tokens: select_max_tokens, // 1 to 4000
                                model: select_model,
                                temperature: select_temperature, // 0.0 is equivalent to greedy sampling
                                n: select_amount, // Number of results to return
                            }))

                            xhr.onreadystatechange = function () {
                                if (this.readyState === 4) {
                                    if (this.status === 200) {
                                        const response = JSON.parse(this.responseText);
                                        const choices = response.choices;
                                        let completeText = choices
                                            .map(choice => `<p>${escapeHtml(choice.message.content)}</p>`)
                                            .join("");
                                        element.setHtml(completeText);
                                    } else {
                                        element.setText(' Error: ' + this.responseText)
                                    }
                                }
                            }

                            // Catch error if openai api is not available.
                            xhr.onerror = function () {
                                element.setText(' Error: ' + this.responseText)
                            }
                        }
                    },
                ]
            },
            {
                id: 'tab-advanced',
                label: editor.lang.cowriter.tabAdvanced,
                elements: [
                    // Add select field with options to choose the model from openai api.
                    {
                        type: 'select',
                        id: 'model',
                        title: editor.lang.cowriter.modelSelction,
                        label: editor.lang.cowriter.modelSelctionLabel,
                        default: "gpt-4",
                        items: [
                            ["GPT-4", "gpt-4"],
                            ["GPT-3.5", "gpt-3.5-turbo"]
                        ],
                        setup: function (element) {
                            this.setValue(element.getText())
                        }
                    },
                    // Add select field with different temperatures from 0 to 2
                    {
                        type: 'select',
                        id: 'temperature',
                        title: editor.lang.cowriter.temperature,
                        label: editor.lang.cowriter.temperatureLabel,
                        default: 0.5,
                        items: [
                            ['0.0', 0.01],
                            ['0.25', 0.25],
                            ['0.5', 0.5],
                            ['0.75', 0.75],
                            ['1.0', 1.0],
                            ['1.25', 1.25],
                            ['1.5', 1.5],
                            ['1.75', 1.75],
                            ['2.0', 2.0]
                        ],
                        setup: function (element) {
                            element.setAttribute('type', 'number');
                            this.setValue(element.getText());
                        },
                        commit: function (element) {

                        }
                    },
                    // Add select field for number of results
                    {
                        type: 'select',
                        id: 'amount',
                        title: editor.lang.cowriter.amount,
                        label: editor.lang.cowriter.amountLabel,
                        default: 1,
                        items: [
                            ['1', 1],
                            ['2', 2],
                            ['3', 3],
                            ['4', 4]
                        ],
                        setup: function (element) {
                            element.setAttribute('type', 'number');
                            this.setValue(element.getText());
                        },
                        commit: function (element) {

                        }
                    }
                ]
            }
        ],
        onOk: function () {
            let dialog = this,
                cowriter = editor.document.createElement('div');

            // overwrite default values with settings in dialog
            select_model = dialog.getValueOf('tab-advanced', 'model');
            select_temperature = parseFloat(dialog.getValueOf('tab-advanced', 'temperature'));
            select_amount = parseInt(dialog.getValueOf('tab-advanced', 'amount'));
            // set max_tokens according to chosen model
            switch(select_model) {
                case 'gpt-4':
                    select_max_tokens = 4000;
                    break;
                case 'gpt-3.5-turbo':
                    select_max_tokens = 4000;
                    break;
                default:
                    select_max_tokens = 4000;
            }
            dialog.commitContent(cowriter)
            editor.insertElement(cowriter)
        }
    }
})

// Add CKeditor 4 button plugin.
CKEDITOR.plugins.add('cowriter', {
    icons: 'cowriter',
    lang: ['en', 'de'],
    init: function (editor) {
        editor.addCommand('cowriter', new CKEDITOR.dialogCommand('cowriterDialog'))
        editor.ui.addButton('Cowriter', {
            label: 'Co-Writer',
            command: 'cowriter',
            toolbar: 'insert',
            icon: this.path + 'icons/cowriter-logo.png'
        })
    }
})

// Add CKeditor 4 button shortcut "ALT + C".
CKEDITOR.config.keystrokes = [
    [CKEDITOR.ALT + 67, 'cowriter']
]
