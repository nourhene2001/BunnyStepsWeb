pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                git url: 'https://github.com/nourhene2001/BunnyStepsWeb.git',
                    branch: 'main'
            }
        }

        stage('Backend: Install & Test') {
            agent {
                docker {
                    image 'bunny-ci:python-node'
                }
            }

            steps {
                sh '''
                    echo "=== Enter backend ==="
                    cd backend

                    echo "=== Create virtual env ==="
                    python -m venv venv
                    . venv/bin/activate

                    pip install --upgrade pip
                    pip install -r requirements.txt
                    pip install pytest pytest-html

                    echo "=== Create report folder ==="
                    mkdir -p test-reports

                    echo "=== Run ALL tests (unit + integration) ==="
                    pytest BunnySteps/Tests \
                        --junitxml=test-reports/results.xml \
                        --html=test-reports/report.html \
                        --self-contained-html || true
                '''
            }

            post {
                always {

                    // 1️⃣ Show test results inside Jenkins UI
                    junit allowEmptyResults: true,
                          testResults: 'backend/test-reports/results.xml'

                    // 2️⃣ Save HTML report as downloadable artifact
                    archiveArtifacts artifacts: 'backend/test-reports/*.html',
                                     fingerprint: true
                }
            }
        }
    }

    post {
        success { echo 'Pipeline succeeded! 🎉' }
        failure { echo 'Pipeline failed – check logs.' }
    }
}
