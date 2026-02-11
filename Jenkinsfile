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
        
                    echo "=== Run ALL tests ==="
                    pytest BunnySteps/Tests \
                        -v \
                        --tb=short \
                        --html=test-reports/report.html \
                        --self-contained-html \
                        --junitxml=test-reports/results.xml || true
                '''
            }
            post {
                always {
                    junit allowEmptyResults: true,
                          testResults: 'backend/test-reports/results.xml'
        
                    publishHTML target: [
                        allowMissing:          false,
                        alwaysLinkToLastBuild: true,
                        keepAll:               true,
                        reportDir:             'backend/test-reports',
                        reportFiles:           'report.html',
                        reportName:            'Backend Tests Report',
                        reportTitles:          'Pytest Report - BunnySteps Backend'
                    ]
        
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
