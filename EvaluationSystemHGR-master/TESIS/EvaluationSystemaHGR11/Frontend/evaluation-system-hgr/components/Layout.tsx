
import React, { ReactNode, useEffect, useState} from 'react'
import Head from 'next/head'
import NoService from "./NoService";
import { usePathname } from 'next/navigation';
import { Disclosure} from '@headlessui/react';
import { faGripLines as MenuRounded, faClose as  CloseRounded} from '@fortawesome/free-solid-svg-icons';
import {Model, ModelService} from "../services/models";

import { faMapLocation as MapIcon, faPhone as PhoneIcon, faMessage as ChatBubbleLeftIcon} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import { faFacebook, faTwitter, faYoutube } from '@fortawesome/free-brands-svg-icons';
type Props = {
    children?: ReactNode,
    title?: string,
}

const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Rank Models', href: '/models' },
    { name: 'Submit', href: '/submit_model' },
    { name: 'Help', href: '/help' },
];
function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}

const Layout = ({children, title = 'Evaluation System HGR' }: Props) => {

    const [serviceOn, isServiceOn] = useState(true);

    const pathname = usePathname();
    useEffect(()=>{
        async function getModels() {
            const modelsApi: Model[] = await ModelService.getModels();
            if(modelsApi.length == 0){
                isServiceOn(false);
            }
        }

        getModels();
    },[])

    return(<>
        <div>
            <Head>
                <title>{title}</title>
                <meta charSet="utf-8"/>
                <meta name="viewport" content="initial-scale=1.0, width=device-width"/>
            </Head>
            <header>

                <Disclosure as="nav" className="bg-white shadow-sm">
                    {({ open }) => (
                        <>
                            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                                <div className="flex h-16 justify-between">
                                    <div className="flex">
                                        <div className="flex flex-shrink-0 items-center">
                                            <img
                                                alt=""
                                                src="/LOGO_Facultades-es.png"
                                                width="270px"
                                                className="d-inline-block align-top"
                                            />
                                        </div>
                                        <div className="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
                                            {navigation.map((item) => (
                                                <a
                                                    key={item.name}
                                                    href={item.href}
                                                    className={classNames(
                                                        pathname === item.href
                                                            ? 'border-slate-500 text-gray-900'
                                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                                                        'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium'
                                                    )}
                                                    aria-current={pathname === item.href ? 'page' : undefined}
                                                >
                                                    {item.name}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="hidden sm:ml-6 sm:flex sm:items-center">

                                    </div>
                                    <div className="-mr-2 flex items-center sm:hidden">
                                        <Disclosure.Button className="inline-flex items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2">
                                            <span className="sr-only">Open main menu</span>
                                            {open ? (
                                                <FontAwesomeIcon icon={CloseRounded} aria-hidden="true"></FontAwesomeIcon>
                                            ) : (
                                                <FontAwesomeIcon icon={MenuRounded} aria-hidden="true"></FontAwesomeIcon>
                                            )}
                                        </Disclosure.Button>
                                    </div>
                                </div>
                            </div>

                            <Disclosure.Panel className="sm:hidden">
                                <div className="space-y-1 pt-2 pb-3">
                                    {navigation.map((item) => (
                                        <Disclosure.Button
                                            key={item.name}
                                            as="a"
                                            href={item.href}
                                            className={classNames(
                                                pathname === item.href
                                                    ? 'border-b-pink-400'
                                                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800',
                                                'block pl-3 pr-4 py-2 border-l-4 text-base font-medium'
                                            )}
                                            aria-current={pathname === item.href ? 'page' : undefined}
                                        >
                                            {item.name}
                                        </Disclosure.Button>
                                    ))}
                                </div>

                            </Disclosure.Panel>
                        </>
                    )}
                </Disclosure>


            </header>
            <div >
                {serviceOn? children: <NoService></NoService>}
                {/*{children}*/}
            </div>
            <br/>
            <footer className="bg-white shadow-sm border-t border-gray-200">
                <div style={{display:"flex", flexWrap:"wrap", }}>
                    <div style={{flex:"1 1 300px", margin:"10px"}}>
                        <p> <strong>Direction</strong></p>
                        <p ><FontAwesomeIcon icon={MapIcon}></FontAwesomeIcon> Ladrón de Guevara E11-253, Quito – Ecuador</p>
                        <p >Campus Politécnico “José Rubén Orellana”</p>
                        <p >Facultad de Ingeniería de Sistemas”</p>
                        <p >Cuarto Piso</p>
                    </div>
                    <div style={{flex:"1 1 300px", margin:"10px"}}>
                        <p> <strong>Contact</strong></p>
                        <p ><FontAwesomeIcon icon={PhoneIcon}></FontAwesomeIcon> (+593) 2 2976300 ext. 4706</p>
                        <p ><FontAwesomeIcon icon={ChatBubbleLeftIcon}></FontAwesomeIcon> laboratorio.ia@epn.edu.ec</p>
                    </div>
                    <div style={{flex:"1 1 300px", margin:"10px", }}
                    >
                        <p> <strong>Follow us</strong></p>
                        <div >
                            <a href="#https://www.facebook.com/laboratorio.IA.EPN" target="_blank" rel="noopener noreferrer">
                                <FontAwesomeIcon icon={faFacebook}  style={{padding:"5px"}} size={"lg"}/>
                            </a>
                            <a href="https://twitter.com/EPNEcuador" target="_blank" rel="noopener noreferrer">
                                <FontAwesomeIcon icon={faTwitter} style={{padding:"5px"}} size={"lg"}/>
                            </a>
                            <a href="https://www.youtube.com/channel/UCWE-OhGIh4rB6bp_MwKWQwQ" target="_blank" rel="noopener noreferrer">
                                <FontAwesomeIcon icon={faYoutube} style={{padding:"5px"}} size={"lg"}/>
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    </>)
}

export default Layout