import { useState } from "preact/hooks";
import { ModalPane } from "../../misc/elements/modal-pane";

import "./help-dialog.css"
import HelpContent from "./help-content";

export default function HelpDialog() {

    const [visible, setVisible] = useState(false);

    return (<>
        <div className={'floating-w'}>
            <div className={'floating-rt'}>
                <button onClick={() => setVisible(!visible)}>Help Me Now</button>
            </div>
        </div>

        <ModalPane visible={visible} className="help-pane">
            <div class={'actions'}>
                <button className={'size-s'} 
                    onClick={() => setVisible(false)}>Close Me Now</button>
            </div>

            <HelpContent />
            
        </ModalPane>
    </>);
}