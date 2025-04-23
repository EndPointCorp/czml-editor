import modelSvg from "../../assets/model.svg";
import billboardSvg from "../../assets/billboard.svg";
import labelSvg from "../../assets/label.svg";
import polygonSvg from "../../assets/polygon.svg";
import polylineSvg from "../../assets/polyline.svg";
import folderSvg from "../../assets/folder.svg";

const typeIcons = {
    billboard: billboardSvg,
    label: labelSvg,
    polygon: polygonSvg,
    polyline: polylineSvg,
    folder: folderSvg,
    model: modelSvg
}

type TypeIconProps = {
    type?: string;
}
export function TypeIcon({type}: TypeIconProps) {

    const icon = type && typeIcons[type as keyof typeof typeIcons];

    return <span class={'entity-type'}>
        <img alt={type} src={icon} />
    </span> 
}