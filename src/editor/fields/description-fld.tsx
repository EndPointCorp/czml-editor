import { useCallback, useContext, useEffect, useRef, useState } from "preact/hooks";
import { ViewerContext } from "../../app";
import { Entity, InfoBox } from "cesium";
import format from "html-format";

import "./description-fld.css";
import { ModalPane } from "../../misc/elements/modal-pane";

type DescriptionFldProps = {
    entity: Entity
}
export function DescriptionFld({entity}: DescriptionFldProps) {
    
    const [preview, setPreview] = useState(false);
    const [edit, setEdit] = useState(false);
    
    const viewer = useContext(ViewerContext);
    
    const infoBoxRef = useRef<InfoBox>();
    
    const description = entity?.description;

    const [editorContent, setEditorContent] = useState<string>();

    const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        setPreview(false);
        
        const infoBox = infoBoxRef.current;
        if (infoBox) {
            infoBox.viewModel.showInfo = false;
            infoBox.viewModel.description = description || '';
        }

    }, [description, infoBoxRef, setPreview]);

    useEffect(() => {
        if (viewer) {
            infoBoxRef.current = new InfoBox(viewer.container);
            infoBoxRef.current.viewModel.closeClicked.addEventListener(() => {
                setPreview(false);
                if (infoBoxRef.current) {
                    infoBoxRef.current.viewModel.showInfo = false;
                }
            });
            return () => {
                infoBoxRef.current?.destroy();
                infoBoxRef.current = undefined;
            }
        }
    }, [infoBoxRef, viewer, setPreview]);

    const handlePreview = useCallback(() => {
        const show = !preview;
        setPreview(show);

        const infoBox = infoBoxRef.current;
        if (infoBox) {
            infoBox.viewModel.description = description || '';
            infoBox.viewModel.showInfo = show && !!description;
        }

    }, [description, infoBoxRef, preview, setPreview]);


    const handleEditClick = useCallback(() => {
        setEdit(true);
        setEditorContent(description);
    }, [description, setEditorContent, setEdit]);

    const handleEditCancel = useCallback(() => {
        setEdit(false);
        setEditorContent(undefined); 
    }, [setEditorContent, setEdit]);
    
    const handleEditSave = useCallback(() => {
        if (entity) {
            entity.description = editorContent;
        }
        
        setEdit(false);
        setEditorContent(undefined);
    }, [entity, editorContent, setEditorContent, setEdit]);


    const handleEditorInput = useCallback((evnt: Event) => {
        setEditorContent((evnt.target as HTMLTextAreaElement).value);
    }, [entity, setEditorContent]);

    const handleFormatting = useCallback(() => {
        const text = textAreaRef.current?.value;
        const description = text && removeEmptyStrings(format(text));
        if (entity && description) {
            entity.description = description;
            setEditorContent(description);
        }
    }, [textAreaRef, entity, setEditorContent]);

    return (
    <div class={'entity-description-fld'}>
        <ModalPane visible={edit} >
            <div class={'editor-actions'}>
                <button onClick={handleEditSave}>Save</button>
                <span>&nbsp;</span>
                <button onClick={handleEditCancel}>Cancel</button>
                <span>&nbsp;</span>
                <button onClick={handleFormatting}>Format</button>
            </div>
            <textarea ref={textAreaRef} class={'description-editor'}
                onChange={handleEditorInput}>{editorContent}</textarea>
        </ModalPane>
        <div class={'label'}>Description</div>
        <div class={'sescription-fld-actions button-size-s'}>
            <button onClick={handlePreview}>Preview</button>
            <span class={'spacer'}>&nbsp;</span>
            <button onClick={handleEditClick} >Edit</button>
        </div>
    </div>);
}

function removeEmptyStrings(str?: string) {
    if (!str) return str;

    return str.split('\n').filter(s => !s.match(/^[\s]*$/)).join('\n');
}
