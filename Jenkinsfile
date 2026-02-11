stage('Backend: Install & Test') {
    agent {
        docker {
            image 'bunny-ci:python-node'
        }
    }
    steps {
        sh '''
            cd backend

            python -m venv venv
            . venv/bin/activate

            pip install -r requirements.txt
            pip install pytest-html

            mkdir -p test-reports

            pytest BunnySteps/Tests \
                --junitxml=test-reports/results.xml \
                --html=test-reports/report.html \
                --self-contained-html || true
        '''
    }
    post {
        always {
            junit allowEmptyResults: true,
                  testResults: 'backend/test-reports/*.xml'

            archiveArtifacts artifacts: 'backend/test-reports/*.html',
                             fingerprint: true
        }
    }
}
