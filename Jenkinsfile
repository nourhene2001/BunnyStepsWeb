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
                    cd backend || { echo "backend folder missing"; exit 1; }

                    echo "=== Create virtual env ==="
                    python -m venv venv
                    . venv/bin/activate

                    echo "=== Install dependencies ==="
                    pip install --upgrade pip
                    pip install -r requirements.txt
                    pip install pytest pytest-html pytest-django

                    echo "=== Create report folder ==="
                    mkdir -p test-reports

                    echo "=== Run ALL tests (unit + integration) ==="
                    pytest BunnySteps/Tests \
                        --junitxml=test-reports/results.xml \
                        --html=test-reports/report.html \
                        --self-contained-html \
                        --verbose \
                        --tb=short \
                        --showlocals || true
                '''
            }
            post {
                always {
                    // 1. Show JUnit results + trend graph in Jenkins UI
                    junit allowEmptyResults: true,
                          testResults: 'backend/test-reports/results.xml'

                    // 2. Publish the nice HTML report as a tab/link in the job page
                    publishHTML target: [
                        allowMissing:          false,
                        alwaysLinkToLastBuild: true,
                        keepAll:               true,
                        reportDir:             'backend/test-reports',
                        reportFiles:           'report.html',
                        reportName:            'Backend Tests Report',
                        reportTitles:          'Pytest Report - BunnySteps Backend'
                    ]

                    // 3. Optional: Archive the HTML file so you can download it
                    archiveArtifacts artifacts: 'backend/test-reports/report.html',
                                     fingerprint: true,
                                     allowEmptyArchive: true
                }
            }
        }
    }

    post {
        success { echo 'Pipeline succeeded! 🎉' }
        failure { echo 'Pipeline failed – check logs.' }
        always  { cleanWs() }
    }
}
