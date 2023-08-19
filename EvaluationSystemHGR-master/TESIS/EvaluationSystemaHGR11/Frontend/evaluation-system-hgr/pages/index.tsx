import Head from 'next/head'
import Image from 'next/image'
import { Inter } from '@next/font/google'
import styles from '../styles/Home.module.css'
import Layout from "../components/Layout";
import {Card} from "react-bootstrap";

export default function Home() {
  return (
    <>
      <Layout>
      <Head>
        <title>System of Evaluation HGR</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
          <Card>
              <Card.Title className="text-center">EMG Gesture Recognition Evaluator</Card.Title>
              <div className={styles.center}>
                  <Image
                      className={styles.logo}
                      src="/Banner_en_espanol.png"
                      alt="Next.js Logo"
                      width= {800}
                      height={400}
                      priority
                  />

              </div>
              <Card.Title className="text-center">Manages submissions of Hand Gesture Recognition Models based on EPN612 dataset.</Card.Title>
              <p>This web application is a HGR Evaluation System for eleven and 5 gestures. The files for are divided into different datasets that are described below:</p>
              <br/>
              <br/>
              <p><strong>EMG-EPN-612</strong></p>
              <p>Dataset (in JSON format) with EMG signals of 5 hand gestures measured across 612 users using the MYO Armband sensor.</p>
              <p><em><strong>Download dataset: </strong> </em> <a href={"https://doi.org/10.5281/zenodo.4023305"}>
                  https://doi.org/10.5281/zenodo.4023305
              </a></p>
              <br/>
              <p>Example of how to use the dataset to implement and evaluate an HGR model in Python and Matlab:</p>
              <p><strong>Python: </strong> <a href={"https://github.com/laboratorioAI/DTW_ANN_EPN_Python"}>
                  https://github.com/laboratorioAI/DTW_ANN_EPN_Python
              </a></p>
              <p><strong>Matlab: </strong><a href={"https://github.com/laboratorioAI/DTW_ANN_EPN_Matlab"}>
                  https://github.com/laboratorioAI/DTW_ANN_EPN_Matlab
              </a></p>
              <br/>
              <br/>
              <p><strong>EMG-EPN-120</strong></p>
              <p>Dataset (in Matlab® mat format) with EMG signals of 5 hand gestures measured on a total of 120 users using the Myo Armband sensor.</p>
              <p><em><strong>Download dataset: </strong> </em> <a href={"https://epnecuador-my.sharepoint.com/:f:/g/personal/laboratorio_ia_epn_edu_ec/EsEYFECP7fNGsSbR4b5ys7EBbN2LBOMcu-LYntQM74aBcA?e=sjhHww"}>
                  https://epnecuador-my.sharepoint.com/:f:/g/personal/laboratorio_ia_epn_edu_ec/EsEYFECP7fNGsSbR4b5ys7EBbN2LBOMcu-LYntQM74aBcA?e=sjhHww
              </a></p>

              <br/>
              <br/>
              <p><strong>EMG-IMU-EPN-100+</strong></p>
              <p>EMG-IMU data set for 12 different categories of hand gestures (11 different hand gestures and 1 relaxation gesture), in which 5 of them are static gestures (wave, wave, fist, open, pinch) and the other 6 are dynamic gestures (up, down, left, right, forward, backward). Data was collected using the Myo cuff (an 8-channel sensor at 200 Hz sampling rate) and the G-force cuff (an 8-channel sensor at 1 kHz sampling rate). The data for each user in the training set is made up of 180 repetitions of hand gestures --15 repetitions for each gesture--, and the other 180 samples are for validation or testing.</p>
              <p><em><strong>Download dataset: </strong> </em> <a href={"https://epnecuador-my.sharepoint.com/:f:/g/personal/laboratorio_ia_epn_edu_ec/EnUgKpozVsFPueuqFyZOqYwBAzrh8mYi5UyorPxxQC2g1Q?e=fS144a"}>
                  https://epnecuador-my.sharepoint.com/:f:/g/personal/laboratorio_ia_epn_edu_ec/EnUgKpozVsFPueuqFyZOqYwBAzrh8mYi5UyorPxxQC2g1Q?e=fS144a
              </a></p>

          </Card>

      </main>

      </Layout>
    </>
  )
}
