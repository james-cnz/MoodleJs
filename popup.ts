/*
 * Moodle JS OP Panel Script
 * UI scripts.
 */

namespace MJS {




    export class Popup {


        public tabData:            TabData;

        private macro_uis:          Macro_UI[];

        private status_dom:         HTMLFieldSetElement;
        private progress_bar_dom:   HTMLProgressElement;
        private status_running_dom: HTMLDivElement;
        private cancel_button_dom:  HTMLButtonElement;
        private status_error_dom:   HTMLDivElement;
        private error_message_dom:  HTMLTextAreaElement;
        private reset_button_dom:   HTMLButtonElement;


        constructor() {

            this.macro_uis = [
                new New_Course_UI(this),
                new Index_Rebuild_UI(this),
                new New_Section_UI(this),
                new New_Topic_UI(this),
                new Test_UI(this)
            ];

            this.status_dom         = document.querySelector("fieldset#status")         as HTMLFieldSetElement;
            this.progress_bar_dom   = document.querySelector("progress#progress_bar")   as HTMLProgressElement;
            this.status_running_dom = document.querySelector("div#status_running")      as HTMLDivElement;
            this.cancel_button_dom  = document.querySelector("button#cancel_button")    as HTMLButtonElement;
            this.status_error_dom   = document.querySelector("div#status_error")        as HTMLDivElement;
            this.error_message_dom  = document.querySelector("textarea#error_message")  as HTMLTextAreaElement;
            this.reset_button_dom   = document.querySelector("button#reset_button")     as HTMLButtonElement;

            void this.init();

        }


        public update() {

            for (const macro_ui of this.macro_uis) {
                macro_ui.update();
            }

            // console.log("before status display set");
            this.status_dom.setAttribute("style", "display: " + (this.tabData.macro_state == 0 ? "none" : "block") + ";");
            // console.log("after status display set");
            if (this.tabData.macro_state != 0) {
                this.progress_bar_dom.value = this.tabData.macro_progress;
                this.progress_bar_dom.max   = this.tabData.macro_progress_max;
                this.status_running_dom.setAttribute("style", "display: " + (this.tabData.macro_state > 0 ? "block" : "none") + ";");
                if (this.tabData.macro_state < 0) {
                    this.error_message_dom.value = /*"Error type:" + this.tabData.macro_error.name + "\n"
                                                +*/ this.tabData.macro_error.message + "\n"
                                                + (this.tabData.macro_error.fileName ? ("file: " + this.tabData.macro_error.fileName + " line: " + this.tabData.macro_error.lineNumber + "\n") : "");
                }
                this.status_error_dom.setAttribute("style", "display: " + (this.tabData.macro_state < 0 ? "block" : "none") + ";");
            }

        }


        public update_progress() {
            this.progress_bar_dom.value = this.tabData.macro_progress;
        }


        public close() {
            window.close();
        }


        private async init() {
            const tab       = (await browser.tabs.query({active: true, currentWindow: true}))[0];
            const bg_page   = await browser.runtime.getBackgroundPage() as unknown as BackgroundWindow;
            this.tabData    = bg_page.mjs_background.getTabData(tab.id as number);
            this.tabData.popup = this;
            const this_popup: Popup = this;
            this.cancel_button_dom.addEventListener("click", function() { this_popup.onCancel(); });
            this.reset_button_dom.addEventListener("click", function() { this_popup.onReset(); });
            this.update();
        }


        private onCancel() {
            this.tabData.macro_cancel = true;
        }


        private onReset() {
            void this.tabData.init();
            this.close();
        }


    }




    abstract class Macro_UI {

        protected popup: Popup;

        constructor(new_popup: Popup) {
            this.popup = new_popup;
        }

        public abstract update(): void;

    }




    class New_Course_UI extends Macro_UI {

        private new_course_dom:             HTMLFieldSetElement;
        private new_course_name_dom:        HTMLInputElement;
        private new_course_shortname_dom:   HTMLInputElement;
        private new_course_start_dom:       HTMLInputElement;
        private new_course_button_dom:      HTMLButtonElement;

        constructor(new_popup: Popup) {
            super(new_popup);
            this.new_course_dom             = document.querySelector("fieldset#new_course")         as HTMLFieldSetElement;
            this.new_course_name_dom        = document.querySelector("input#new_course_name")       as HTMLInputElement;
            this.new_course_shortname_dom   = document.querySelector("input#new_course_shortname")  as HTMLInputElement;
            this.new_course_start_dom       = document.querySelector("input#new_course_start")      as HTMLInputElement;
            this.new_course_button_dom      = document.querySelector("button#new_course_button")    as HTMLButtonElement;
            const this_ui = this;
            this.new_course_name_dom.addEventListener("input", function() { this_ui.onInput(); });
            this.new_course_shortname_dom.addEventListener("input", function() { this_ui.onInput(); });
            this.new_course_button_dom.addEventListener("click", function() { this_ui.onClick(); });
        }

        public update() {
            this.new_course_dom.setAttribute("style", "display: " + ((this.popup.tabData.macro_state == 0 && this.popup.tabData.macros.new_course.prereq) ? "block" : "none") + ";");
        }

        private onInput() {
            this.new_course_button_dom.disabled = !(this.new_course_name_dom.value != "" && this.new_course_shortname_dom.value != "");
        }

        private onClick() {
            /*(this.popup.tabData.macros.new_course as New_Course_Macro).new_course = {
                fullname:   this.new_course_name_dom.value,
                shortname:  this.new_course_shortname_dom.value,
                startdate:  (this.new_course_start_dom.valueAsDate as Date).getTime() / 1000
            };*/
            (this.popup.tabData.macros.new_course as New_Course_Macro).new_course_fullname = this.new_course_name_dom.value;
            (this.popup.tabData.macros.new_course as New_Course_Macro).new_course_shortname = this.new_course_shortname_dom.value;
            (this.popup.tabData.macros.new_course as New_Course_Macro).new_course_startdate = (this.new_course_start_dom.valueAsDate as Date).getTime() / 1000;
            void this.popup.tabData.macros.new_course.run();
        }

    }




    class Index_Rebuild_UI extends Macro_UI {

        private index_rebuild_dom:          HTMLFieldSetElement;
        private index_rebuild_button_dom:   HTMLButtonElement;

        constructor(new_popup: Popup) {
            super(new_popup);
            this.index_rebuild_dom          = document.querySelector("fieldset#index_rebuild")      as HTMLFieldSetElement;
            this.index_rebuild_button_dom   = document.querySelector("button#index_rebuild_button") as HTMLButtonElement;
            const this_ui = this;
            this.index_rebuild_button_dom.addEventListener("click", function() { this_ui.onClick(); });
        }

        public update() {
            this.index_rebuild_dom.setAttribute("style", "display: " + ((this.popup.tabData.macro_state == 0 && this.popup.tabData.macros.index_rebuild.prereq) ? "block" : "none") + ";");
        }

        private onClick() {
            void this.popup.tabData.macros.index_rebuild.run();
        }

    }



    class New_Section_UI extends Macro_UI {

        private new_section_dom:            HTMLFieldSetElement;
        private new_section_name_dom:       HTMLInputElement;
        private new_section_shortname_dom:  HTMLInputElement;
        private new_section_button_dom:     HTMLButtonElement;

        constructor(new_popup: Popup) {
            super(new_popup);
            this.new_section_dom            = document.querySelector("fieldset#new_section")        as HTMLFieldSetElement;
            this.new_section_name_dom       = document.querySelector("input#new_section_name")      as HTMLInputElement;
            this.new_section_shortname_dom  = document.querySelector("input#new_section_shortname") as HTMLInputElement;
            this.new_section_button_dom     = document.querySelector("button#new_section_button")   as HTMLButtonElement;
            const this_ui = this;
            this.new_section_name_dom.addEventListener("input", function() { this_ui.onInput(); });
            this.new_section_shortname_dom.addEventListener("input", function() { this_ui.onInput(); });
            this.new_section_button_dom.addEventListener("click", function() { this_ui.onClick(); });
        }

        public update() {
            this.new_section_dom.setAttribute("style", "display: " + ((this.popup.tabData.macro_state == 0 && this.popup.tabData.macros.new_section.prereq) ? "block" : "none") + ";");
        }

        private onInput() {
            this.new_section_button_dom.disabled = !(this.new_section_name_dom.value != "" && this.new_section_shortname_dom.value != "");
        }

        private onClick() {
            (this.popup.tabData.macros.new_section as New_Section_Macro).new_section = {
                fullname: this.new_section_name_dom.value,
                name: this.new_section_shortname_dom.value
            };
            void this.popup.tabData.macros.new_section.run();
        }

    }



    class New_Topic_UI extends Macro_UI {

        private new_topic_dom:          HTMLFieldSetElement;
        private new_topic_name_dom:     HTMLInputElement;
        private new_topic_button_dom:   HTMLButtonElement;

        constructor(new_popup: Popup) {
            super(new_popup);
            this.new_topic_dom          = document.querySelector("fieldset#new_topic")      as HTMLFieldSetElement;
            this.new_topic_name_dom     = document.querySelector("input#new_topic_name")    as HTMLInputElement;
            this.new_topic_button_dom   = document.querySelector("button#new_topic_button") as HTMLButtonElement;
            const this_ui = this;
            this.new_topic_name_dom.addEventListener("input", function() { this_ui.onInput(); });
            this.new_topic_button_dom.addEventListener("click", function() { this_ui.onClick(); });
        }

        public update() {
            this.new_topic_dom.setAttribute("style", "display: " + ((this.popup.tabData.macro_state == 0 && this.popup.tabData.macros.new_topic.prereq) ? "block" : "none") + ";");
        }

        private onInput() {
            this.new_topic_button_dom.disabled = !(this.new_topic_name_dom.value != "");
        }

        private onClick() {
            (this.popup.tabData.macros.new_topic as New_Topic_Macro).new_topic_name = this.new_topic_name_dom.value;
            void this.popup.tabData.macros.new_topic.run();
        }

    }


    class Test_UI extends Macro_UI {

        private test_button_dom: HTMLButtonElement;

        constructor(new_popup: Popup) {
            super(new_popup);
            this.test_button_dom = document.querySelector("button#test_button") as HTMLButtonElement;
            const this_ui = this;
            this.test_button_dom.addEventListener("click", function() { this_ui.onClick(); });
        }

        public update() {
        }

        private onClick() {
            void this.popup.tabData.macros.test.run();
        }

    }




    const mjs_popup: Popup = new Popup();




}
