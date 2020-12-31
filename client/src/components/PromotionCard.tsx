import React, { FunctionComponent } from 'react';
import { Card, Media, Image, Title } from 'rbx';
import TimeAgo from 'react-timeago';

interface Props {
    username: string;
    oldRole: string;
    newRole: string;
    userId: number;
    at: string;
}   

const Promotion: FunctionComponent<Props> = (props) => {
    return (
        <Card>
            <Card.Content>
                <Media>
                    <Media.Item align="left">
                        <figure className="image is-48x48">
                            <Image rounded loading="lazy" src={`https://www.roblox.com/headshot-thumbnail/image?userId=${props.userId}&width=180&height=180&format=png`}></Image>
                        </figure>
                    </Media.Item>

                    <Media.Item align="content">
                        <Title size={4} style={{ marginBottom: 5 }}>
                            <a href={`https://www.roblox.com/users/${props.userId}/profile`}>{ `${props.username} ` }</a>
                            ({props.oldRole} 
                                <Image.Container style={{ display: 'inline-block', marginLeft: 10, marginRight: 10 }} size={24}>
                                    <Image style={{ marginTop: 4 }} src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAABmJLR0QA/wD/AP+gvaeTAAABHklEQVRoge3YsS4EQRwH4I8rRKh0XkDpAbzBiUQiuXfgISjUlEqtiifQ6OjVXFAIQaeRyCnukrM3rjAnmRv5f8kku8kWv99mdnZ2CSGEEEIIoTIdvOIRm4WzTOQFvcH4QLtsnHzPhkV6eMda0USZOvjULPOG1ZKhcm1rFunhCSslQ+XalZa5wXLJULkOpGWusVQyVI4ZHEvLXGGxYK4sLZxKy5xjrmCuLPO4kJY50y/asI7uDxdP+zgaLXI/BaFyxz7MjjaqUO/7SRu3yt/diafWNBv3sJ+oaEa19Fen0RJVLb/jXoiXWCiY69cOpSWq26LsSUtUt2nckZaobhu/5Z98WN1plqj2U/fBsETVPx829Mt0B8chhBBCCCH8nS/fx+6r2o1XMgAAAABJRU5ErkJggg=="/>
                                </Image.Container> 
                            {props.newRole})
                        </Title>

                        <Title style={{ display: 'inline-block' }} subtitle size={5}>
                            Promoted <TimeAgo date={props.at} />
                        </Title>
                    </Media.Item>
                </Media>
            </Card.Content>
        </Card>
    )
}

export default Promotion;